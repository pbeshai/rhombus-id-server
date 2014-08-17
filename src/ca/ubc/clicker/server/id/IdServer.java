package ca.ubc.clicker.server.id;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.Socket;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Properties;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import ca.ubc.clicker.client.ClickerClient;
import ca.ubc.clicker.server.id.util.SqlUtil;
import ca.ubc.clicker.server.io.BaseIOServer;
import ca.ubc.clicker.server.io.ClickerServerInputThread;
import ca.ubc.clicker.server.messages.ChoiceMessage;
import ca.ubc.clicker.server.messages.ResponseMessage;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class IdServer extends BaseIOServer {
	private static Logger log = LogManager.getLogger();
	private static Logger clicksLog = LogManager.getLogger("clicks");
	
	private static final int DEFAULT_PORT = 4445;
	private static final int DEFAULT_CLICKER_SERVER_PORT = 4444;
	private static final String DEFAULT_CLICKER_SERVER_HOST = "localhost";
	private static final String ALIAS_TABLE = "alias";
	private static final String ALIAS_TABLE_FILE = "/sql/create.sql"; // classpath file
	private static final String DATABASE_NAME = "aliases.db";
	private static final String PING = "{\"command\":\"ping\"}";
	
	private static final String SQL_SELECT_ALIAS = "SELECT alias FROM alias WHERE participantId=?";

	private static final String CONFIG_PROPERTIES_FILE = "config.properties";
	
	private String clickerServerHost;
	private int clickerServerPort;
	private PrintWriter outClickerServer;
    private JsonParser parser;
    private GsonBuilder gsonBuilder;
    
	public IdServer() {
		this(DEFAULT_PORT, DEFAULT_CLICKER_SERVER_HOST, DEFAULT_CLICKER_SERVER_PORT);
	}
	
	public IdServer(int port, String clickerServerHost, int clickerServerPort) {
		super(port);
		this.clickerServerHost = clickerServerHost;
		this.clickerServerPort = clickerServerPort;
		this.gsonBuilder = new GsonBuilder();
		this.parser = new JsonParser();
	}

	@Override
	public void init() throws IOException {
		super.init();
		
		Socket clickerServer = null;
		try { 
			clickerServer = new Socket(clickerServerHost, clickerServerPort);
			outClickerServer = new PrintWriter(clickerServer.getOutputStream(), true);
		} catch(IOException e) {
			log.error("Could not connect to Clicker Server at " + clickerServerHost + ":" + clickerServerPort + ". Exiting...");
			throw e;
		}
		
		// start thread to read input from clicker server
		new ClickerServerInputThread(clickerServer.getInputStream(), this);
		
		initializeDb();
	}
	
	// ensures the database is created
	private void initializeDb() throws FileNotFoundException {
		Connection connection = null;
		try {
			// create a database connection
			connection = getDatabaseConnection();

			// create alias table if it does not exist
			SqlUtil.createTableSafe(connection, ALIAS_TABLE, ALIAS_TABLE_FILE);
		} catch(SQLException e) {
			log.error(e.getMessage());
		} finally {
			try	{
				if(connection != null) {
					connection.close();
				}
			} catch(SQLException e) {
				// connection close failed.
				log.error(e);
			}
		}
	}
	
	private Connection getDatabaseConnection() throws SQLException {
		return  DriverManager.getConnection("jdbc:sqlite:" + DATABASE_NAME);
	}
	
	private Gson gson() {
		return gsonBuilder.create();
	}
	
	@Override
	protected String processOutput(String message) {

		// only process it if it is a choices message.
		if (message.indexOf("{\"type\":\"choices\"") == 0) {
			try {
				JsonObject jsonObj = parser.parse(message).getAsJsonObject();
				JsonArray data = jsonObj.get("data").getAsJsonArray();
				
				// read aliases from database
				ChoiceMessage[] choices = alias(data);
				
				// re-serialize
				ResponseMessage response = new ResponseMessage();
				response.type = "choices";
				response.data = choices;
				
				return gson().toJson(response);
				
			} catch (IllegalStateException e) { }
		}

		return message;
	}
	
	private ChoiceMessage[] alias(JsonArray data) {
		ChoiceMessage[] choices = new ChoiceMessage[data.size()];
		Gson gson = gson();
		Connection connection = null;
		try {
			// create a database connection
			connection = getDatabaseConnection();
			PreparedStatement preparedStatement = connection.prepareStatement(SQL_SELECT_ALIAS);
			
			// use alias instead of id for each choice
			for (int i = 0; i < data.size(); i++) {
				// convert to object and change attribute value
				choices[i] =  gson.fromJson(data.get(i), ChoiceMessage.class);
				String originalId = choices[i].id;
				choices[i].id = getAlias(preparedStatement, choices[i].id);
				
				// log the result
				if (originalId.equals(choices[i].id)) {
					clicksLog.info("{}:{}", choices[i].id, choices[i].choice);
				} else {
					clicksLog.info("{}:{} ({})", choices[i].id, choices[i].choice, originalId);
				}
			}
		} catch(SQLException e) {
			log.error(e.getMessage());
		} finally {
			try	{
				if(connection != null) {
					connection.close();
				}
			} catch(SQLException e) {
				// connection close failed.
				log.error(e);
			}
		}
	
		return choices;
	}

	// converts clicker ID to an alias by looking it up in the database
	private String getAlias(PreparedStatement preparedStatement, String id) throws SQLException {
		preparedStatement.setString(1, id);
		ResultSet rs = preparedStatement.executeQuery();
		if (rs.next()) {
			id = rs.getString(1);
		}
		return id;
	}
	
	
	@Override
	public void input(String message, ClickerClient client) {
		if (!PING.equals(message)) {
			log.info("[input] {}", message);
		}
		
		outClickerServer.println(message);	
	}
	
	/**
	 * Usage: java IdServer
	 * @param args
	 */
	public static void main(String[] args) throws Exception {
		// load the sqlite-JDBC driver using the current class loader
		Class.forName("org.sqlite.JDBC");
		
		int port = DEFAULT_PORT, clickerServerPort = DEFAULT_CLICKER_SERVER_PORT;
		String clickerServerHost = DEFAULT_CLICKER_SERVER_HOST;
		
		// read from config.properties file
		Properties config = new Properties();
		try {
			config.load(new FileInputStream(CONFIG_PROPERTIES_FILE));
			port = Integer.valueOf(config.getProperty("port", String.valueOf(DEFAULT_PORT)));
			clickerServerPort = Integer.valueOf(config.getProperty("clickerServerPort", String.valueOf(DEFAULT_CLICKER_SERVER_PORT)));
			clickerServerHost = config.getProperty("clickerServerHost", DEFAULT_CLICKER_SERVER_HOST);
		} catch (IOException e) {
			log.error("Could not find config.properties");
		}
		
		log.info("Initializing with port " + port + ", clicker server " + clickerServerHost +  ":" + clickerServerPort);
		
		IdServer server = new IdServer(port, clickerServerHost, clickerServerPort);
		server.run();
	}
}

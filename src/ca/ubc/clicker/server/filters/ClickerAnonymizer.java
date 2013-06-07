package ca.ubc.clicker.server.filters;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.Socket;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import ca.ubc.clicker.client.ClickerClient;
import ca.ubc.clicker.server.filters.util.SqlUtil;
import ca.ubc.clicker.server.io.BaseIOServer;
import ca.ubc.clicker.server.io.ClickerServerInputThread;
import ca.ubc.clicker.server.messages.ChoiceMessage;
import ca.ubc.clicker.server.messages.ResponseMessage;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

public class ClickerAnonymizer extends BaseIOServer {
	private static final int DEFAULT_PORT = 4445;
	private static final int DEFAULT_CLICKER_SERVER_PORT = 4444;
	private static final String DEFAULT_CLICKER_SERVER_HOST = "localhost";
	private static final String ALIAS_TABLE = "alias";
	private static final String ALIAS_TABLE_FILE = "sql/create.sql";
	private static final String DATABASE_NAME = "anonymizer.db";
	
	private static final String SQL_SELECT_ALIAS = "SELECT alias FROM alias WHERE serverId=?";
	
	private String clickerServerHost;
	private int clickerServerPort;
	private PrintWriter outClickerServer;
    private JsonParser parser;
    private GsonBuilder gsonBuilder;
    
	public ClickerAnonymizer() {
		this(DEFAULT_CLICKER_SERVER_HOST, DEFAULT_CLICKER_SERVER_PORT);
	}
	
	public ClickerAnonymizer(String clickerServerHost, int clickerServerPort) {
		super(DEFAULT_PORT);
		this.clickerServerHost = clickerServerHost;
		this.clickerServerPort = clickerServerPort;
		this.gsonBuilder = new GsonBuilder();
		this.parser = new JsonParser();
	}

	@Override
	public void init() throws IOException {
		
		Socket clickerServer = new Socket(clickerServerHost, clickerServerPort);
		outClickerServer = new PrintWriter(clickerServer.getOutputStream(), true);
		
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
			System.err.println(e.getMessage());
		} finally {
			try	{
				if(connection != null) {
					connection.close();
				}
			} catch(SQLException e) {
				// connection close failed.
				System.err.println(e);
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
			
			// create alias table if it does not exist
			for (int i = 0; i < data.size(); i++) {
				// convert to object and change attribute value
				choices[i] =  gson.fromJson(data.get(i), ChoiceMessage.class);
				choices[i].id = getAlias(preparedStatement, choices[i].id);
				System.out.println(choices[i].id + " " + choices[i].choice);
			}
		} catch(SQLException e) {
			System.err.println(e.getMessage());
		} finally {
			try	{
				if(connection != null) {
					connection.close();
				}
			} catch(SQLException e) {
				// connection close failed.
				System.err.println(e);
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
		System.out.println("INPUT: "+message+", client: "+client);
		outClickerServer.println(message);	
	}
	
	/**
	 * Usage: java ClickerAnonymizer
	 * @param args
	 */
	public static void main(String[] args) throws Exception {
		// load the sqlite-JDBC driver using the current class loader
		Class.forName("org.sqlite.JDBC");
		
		ClickerAnonymizer anonymizer = new ClickerAnonymizer();
		anonymizer.run();
	}
}

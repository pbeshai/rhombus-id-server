package ca.ubc.clicker.server.filters;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.Socket;

import ca.ubc.clicker.client.ClickerClient;
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
	public static final int DEFAULT_PORT = 4445;
	public static final int DEFAULT_CLICKER_SERVER_PORT = 4444;
	public static final String DEFAULT_CLICKER_SERVER_HOST = "localhost";
	
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
				Gson gson = gson();
				// convert to object and change attribute value
				ChoiceMessage[] choices = new ChoiceMessage[data.size()];
				for (int i = 0; i < data.size(); i++) {
					choices[i] =  gson.fromJson(data.get(i), ChoiceMessage.class);
					System.out.println("choice id was " + choices[i].id);
					choices[i].id = getAlias(choices[i].id);
				}
				
				// re-serialize
				ResponseMessage response = new ResponseMessage();
				response.type = "choices";
				response.data = choices;
				
				return gson.toJson(response);
				
			} catch (IllegalStateException e) { }
		}

		return message;
	}
	
	// converts clicker Id to an alias
	public String getAlias(String id) {
		return "the-alias";
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
		ClickerAnonymizer anonymizer = new ClickerAnonymizer();
		anonymizer.run();
	}
}

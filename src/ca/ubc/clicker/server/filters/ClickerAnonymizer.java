package ca.ubc.clicker.server.filters;

import java.io.IOException;
import java.io.PrintWriter;
import java.net.Socket;

import ca.ubc.clicker.client.ClickerClient;
import ca.ubc.clicker.server.io.BaseIOServer;
import ca.ubc.clicker.server.io.ClickerServerInputThread;

public class ClickerAnonymizer extends BaseIOServer {
	public static final int DEFAULT_PORT = 4445;
	public static final int DEFAULT_CLICKER_SERVER_PORT = 4444;
	public static final String DEFAULT_CLICKER_SERVER_HOST = "localhost";
	
	private String clickerServerHost;
	private int clickerServerPort;
	private PrintWriter outClickerServer;
    
	public ClickerAnonymizer() {
		this(DEFAULT_CLICKER_SERVER_HOST, DEFAULT_CLICKER_SERVER_PORT);
	}
	
	public ClickerAnonymizer(String clickerServerHost, int clickerServerPort) {
		super(DEFAULT_PORT);
		this.clickerServerHost = clickerServerHost;
		this.clickerServerPort = clickerServerPort;
	}

	@Override
	public void init() throws IOException {
		Socket clickerServer = new Socket(clickerServerHost, clickerServerPort);
		outClickerServer = new PrintWriter(clickerServer.getOutputStream(), true);
		
		// start thread to read input from clicker server
		new ClickerServerInputThread(clickerServer.getInputStream(), this);
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

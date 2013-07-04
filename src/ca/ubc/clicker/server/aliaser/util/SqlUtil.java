package ca.ubc.clicker.server.aliaser.util;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

public class SqlUtil {
	public static void createTableSafe(Connection connection, String table, String sqlFile) throws SQLException, FileNotFoundException {
		SqlRunner runner = new SqlRunner(connection, new PrintWriter(System.out), new PrintWriter(System.err), true, true);
		Statement statement = connection.createStatement();
		statement.setQueryTimeout(30);  // set timeout to 30 sec.
		
		// create alias table if it does not exist
		ResultSet rs = statement.executeQuery("SELECT count(*) FROM sqlite_master WHERE type='table' AND name='" + table + "'");
		if (rs.next() && rs.getInt(1) == 0) {
			runner.runScript(new FileReader(sqlFile));
		}
	}
}

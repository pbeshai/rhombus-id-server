import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import ca.ubc.clicker.server.filters.util.SqlRunner;

public class SQLTest
{
	private static final String ALIAS_TABLE = "alias";
	private static final String ALIAS_TABLE_FILE = "sql/create.sql";
	private static final String DATABASE_FILE = "anonymizer.db";
	
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
	
	public static void main(String[] args) throws ClassNotFoundException, FileNotFoundException
	{
		// load the sqlite-JDBC driver using the current class loader
		Class.forName("org.sqlite.JDBC");

		Connection connection = null;
		try
		{
			// create a database connection
			connection = DriverManager.getConnection("jdbc:sqlite:" + DATABASE_FILE);

			createTableSafe(connection, ALIAS_TABLE, ALIAS_TABLE_FILE);

			Statement statement = connection.createStatement();
			statement.setQueryTimeout(30);  // set timeout to 30 sec.
			statement.executeUpdate("insert into alias values(1, 'server-peter', 'alias-peter')");
			ResultSet rs = statement.executeQuery("select * from alias");
			while(rs.next())
			{
				// read the result set
				System.out.println("id = " + rs.getInt("id"));
				System.out.println("participantId = " + rs.getString("participantId"));
				System.out.println("alias = " + rs.getString("alias"));
				System.out.println("----------");
			}
		}
		catch(SQLException e)
		{
			// if the error message is "out of memory", 
			// it probably means no database file is found
			System.err.println(e.getMessage());
		}
		finally
		{
			try
			{
				if(connection != null)
					connection.close();
			}
			catch(SQLException e)
			{
				// connection close failed.
				System.err.println(e);
			}
		}
	}
}
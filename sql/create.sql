DROP TABLE IF EXISTS alias;

CREATE TABLE alias (
	id integer PRIMARY KEY NOT NULL,
	serverId varchar(255) NOT NULL UNIQUE,
	alias varchar(255) NOT NULL UNIQUE
);

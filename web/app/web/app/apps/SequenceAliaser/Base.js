define([
	"framework/App",
	"framework/modules/common/Common",
],
function (App, Common) {
	var SequenceAliaser = {};

	SequenceAliaser.config = {
		sequenceLength: 4,
		sequenceAliasMap: {
			"AAAD":"leo",
			"AABC":"martha",
			"AACA":"jordan",
			"AADB":"zooey",
			"ABAA":"angie",
			"ABBB":"perry",
			"ABCD":"stiller",
			"ABDC":"pink",
			"ACAC":"halle",
			"ACBD":"lopez",
			"ACCB":"marilyn",
			"ACDA":"spears",
			"ADAB":"aniston",
			"ADBA":"spock",
			"ADCC":"freeman",
			"ADDD":"pitt",
			"BAAA":"will",
			"BABB":"lucy",
			"BACD":"rihanna",
			"BADC":"cera",
			"BBAD":"swift",
			"BBBC":"depp",
			"BBCA":"adele",
			"BBDB":"gosling",
			"BCAB":"jackson",
			"BCBA":"keanu",
			"BCCC":"potter",
			"BCDD":"cruise",
			"BDAC":"arnie",
			"BDBD":"diaz",
			"BDCB":"murray",
			"BDDA":"cruz",
			"CAAB":"bee",
			"CABA":"leia",
			"CACC":"hova",
			"CADD":"scarjo",
			"CBAC":"audrey",
			"CBBD":"elvis",
			"CBCB":"deniro",
			"CBDA":"rdj",
			"CCAA":"holmes",
			"CCBB":"timber",
			"CCCD":"gates",
			"CCDC":"yeezy",
			"CDAD":"jobs",
			"CDBC":"fey",
			"CDCA":"owen",
			"CDDB":"whoopi",
			"DAAC":"portman",
			"DABD":"julia",
			"DACB":"alba",
			"DADA":"liz",
			"DBAB":"maddy",
			"DBBA":"vaughn",
			"DBCC":"oprah",
			"DBDD":"gaga",
			"DCAD":"ellen",
			"DCBC":"marley",
			"DCCA":"ford",
			"DCDB":"bruce",
			"DDAA":"carrey",
			"DDBB":"bond",
			"DDCD":"samuel",
			"DDDC":"mila"
		}
	};

	SequenceAliaser.Instructions = Common.Models.Instructions.extend({
		buttonConfig: {
			A: { description: "A" },
			B: { description: "B" },
			C: { description: "C" },
			D: { description: "D" },
			E: { description: "Clear Sequence", className: "danger" }
		}
	});

	return SequenceAliaser;
});
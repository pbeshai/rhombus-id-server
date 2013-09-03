var _ = require("lodash");

var alphabet = [ "A", "B", "C", "D" ];
var memo = [];
// outputs the list of all strings that are hamming distance <distance> from input
function generateStrings(distance, input) {
	if (distance === 0) {
		return input;
	}

	if (memo[distance] && memo[distance][input]) {
		// console.log("using memo for ", distance, input);
		return memo[distance][input];
	} else if (!memo[distance]) { // initialize memo for this distance
		memo[distance] = {};
	}

	if (distance === 1) {
		var output = [];
		// choose the character to change
		for (var i = 0; i < input.length; i++) {
			var pre = input.substring(0, i);
			var post = input.substring(i + 1, input.length);

			// change the character
			for (var j = 0; j < alphabet.length; j++) {
				if (alphabet[j] !== input[i]) {
					output.push(pre + alphabet[j] + post);
				}
			}
		}
		output = _.uniq(output);
		memo[distance][input] = output;

		return output;
	}

	// recurse
	var output = [];

	for (var i = 0; i < input.length; i++) {
		var pre = input.substring(0, i);
		var post = input.substring(i + 1, input.length);

		var substrings = generateStrings(distance - 1, pre + post);
		// for each substring, recombine with changed letter
		for (var j = 0; j < alphabet.length; j++) {
			if (alphabet[j] !== input[i]) {
				for (var k = 0; k < substrings.length; k++) {
					var subPre = substrings[k].substring(0, i);
					var subPost = substrings[k].substring(i, substrings[k].length);
					output.push(subPre + alphabet[j] + subPost);
				}
			}
		}
	}
	output = _.uniq(output);

	memo[distance][input] = output;
	return output;
}

function generateStringsMore(minDistance, input) {
	var output = [];
	for (var i = minDistance; i <= input.length; i++) {
		output = output.concat(generateStrings(i, input));
	}
	output.push(input); // include the main element
	return _.unique(output);
}

function calculateDistance(string1, string2) {
	if (string1.length !== string2.length) return "ERROR mismatched lengths";
	var distance = 0;
	for (var i = 0; i < string1.length; i++) {
		if (string1[i] !== string2[i]) distance += 1;
	}
	return distance;
}

function allStrings(length) {
	if (length === 1) return alphabet;
	var substrings = allStrings(length - 1)

	var output = [];
	for (var i = 0; i < alphabet.length; i++) {
		output = output.concat(_.map(substrings, function (substr) { return alphabet[i] + substr; }));
	}
	return output;
}

function reduce(hammingDistance, result) {
	var lastExamined = null;
	var prevLength = result.length;
	do {
		var index = _.indexOf(result, lastExamined) + 1;
		var str = result[index];
		if (!str) break;
		var subset = generateStringsMore(hammingDistance, str);
		result = _.intersection(result, subset);
		lastExamined = str;
	} while (true);

	return result;
}

function generative() {
	console.log("running ...");

	var hammingDistance = 3;
	var inputString = "ABCDAA";
	var strings1 = generateStringsMore(hammingDistance, inputString);
	var result = reduce(hammingDistance, strings1).sort();

	console.log(result.join("\t"));

	// error check
	for (var i = 0; i < result.length; i++) {
		for (var j = 0; j < result.length; j++) {
			if (result[i] !== result[j] && calculateDistance(result[i], result[j]) < hammingDistance) {
				console.log("Error: ", result[i], result[j], calculateDistance(result[i], result[j]));
			}
		}
	}

	console.log(result.length + " strings generated with hamming distance at least " + hammingDistance);
	console.log("done.");
}

generative();


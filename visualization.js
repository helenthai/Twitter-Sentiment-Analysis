'use strict';  //treat silly mistakes as run-time errors

function myFunction() {
    var input = d3.select("input");
    var username = input.property("value");
    load_tweet(username);
}

function get_words(tweet) {
    var lowerCaseTweet = tweet.toLowerCase();

    var regex = new RegExp(/\W+/);
    var words = lowerCaseTweet.split(regex);

    var returned = [];
    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        if (word.length > 1) {
            word = word.replace("?", "");
            word = word.replace(":", "");
            word = word.replace("!", "");
            word = word.replace(".", "");
            word = word.replace(",", "");
            word = word.replace(";", "");
            word = word.replace("\"", "");
            word = word.replace("@", "");
            word = word.replace("#", "");

            returned.push(word);
        }
    } 

    return returned;
}

function has_emotion(word, emotion) {
    var word_sentiments = SENTIMENTS[word];
    if (word_sentiments && word_sentiments[emotion]) {
        return word_sentiments[emotion];
    }
}

function filters(emotion, list_of_words) {
    var returned = [];
    for (var i = 0; i < list_of_words.length; i++) {
        var word = list_of_words[i];
        if (has_emotion(word,emotion)) {
            returned.push(word);
        }
    }

    return returned;
}

function emotional_dict(list_of_words) {
    var emotional_words = {};
    for (var i = 0; i < EMOTIONS.length; i++) {
        var emotion = EMOTIONS[i];
        var word_list = filters(emotion, list_of_words);
        emotional_words[emotion] = word_list;
    }

    return emotional_words;
}

function most_common(list_of_words) {
    var freq_words = {};
    for (var i = 0; i < list_of_words.length; i++) {
        var word = list_of_words[i];
        if (freq_words[word]) {
            freq_words[word] = freq_words[word] + 1; 
        } else {
            freq_words[word] = 1;
        }    
    }

   // Create items array
    var items = Object.keys(freq_words).map(function(key) {
        return [key, freq_words[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first, second) {
        return second[1] - first[1];
    });

    return items;
}

function analyze_tweets(tweets) {
    var all_words = [];
    var word_count = 0;

    for (var i = 0; i < tweets.length; i++) {
        var tweet = tweets[i];
        var text = tweet["text"];
        var words = get_words(text);
        word_count = word_count + words.length;
        all_words.push(words);
    } 

    var stats = [];

    for (var i = 0; i < EMOTIONS.length; i++) {
        var emotion = EMOTIONS[i];
    
        var emo_stats = {};
        emo_stats["EMOTION"] = emotion;
        
        var emo_words_per_tweet = [];
        var emo_words_all_tweets = [];
        for (var j = 0; j < all_words.length; j++) {
            var words = all_words[j];
            var filteredWords = filters(emotion, words);
            
            for (var k = 0; k < filteredWords.length; k++) {
                emo_words_all_tweets.push(filteredWords[k]);
            }

            emo_words_per_tweet.push(filteredWords);
        }
        emo_stats["% of WORDS"] = (emo_words_all_tweets.length * 100 / word_count).toFixed(2);


        var most_common_words = most_common(emo_words_all_tweets);
        var example_words = [];
        for (var j = 0; j < 3 && j < most_common_words.length; j++) {
            var jCommon = most_common_words[j];
            example_words.push(jCommon[0]);
        }
        emo_stats["EXAMPLE WORDS"] = example_words;

        var emo_hash_tags = [];
        for (var j = 0; j < tweets.length; j++) {
            if (emo_words_per_tweet[j].length > 0) {
                var tweet = tweets[j];
                var hash_tags = tweet["entities"]["hashtags"];
                for (var k = 0; k < hash_tags.length; k++) { 
                    var hash_tag = hash_tags[k];
                    emo_hash_tags.push(hash_tag["text"].toLowerCase());  
                }
            }
        }

        most_common_words = most_common(emo_hash_tags);
        example_words = [];
        for (var j = 0; j < 3 && j < most_common_words.length; j++) {
            var jCommon = most_common_words[j];
            example_words.push("#" + jCommon[0]);
        }
        emo_stats["HASHTAGS"] = example_words;

        stats.push(emo_stats);
    } 

    return stats;
}

function show_emotion_data(stats) {
    var tableBody = d3.select("tbody");
    tableBody.html('');

    for (var i = 0; i < stats.length; i++) {
        var stat = stats[i];
        var tableRow = tableBody.append("tr");
        var rowContent = "<td>" + stat["EMOTION"] + "</td>" + 
                    "<td>" + stat["% of WORDS"] + "%</td>" + 
                    "<td>" + stat["EXAMPLE WORDS"] +  "</td>" + 
                    "<td>" + stat["HASHTAGS"] +  "</td>";
        tableRow.html(rowContent);
    }   
}

function draw_Pie_Chart(stats){
	var dataset = [];
	for(var i=0; i<stats.length; i++){
		dataset.push(stats[i]["% of WORDS"]);
	}
	var labelset = [];
	for(var j=0; j<stats.length; j++){
		labelset.push(stats[j]["EMOTION"]);
	}
	
	var radius = 200;
	var margin = {top: 20, right: 10, bottom: 20, left: 10};
    var height = 480;
	var width = 600;
    var color = d3.scaleOrdinal()
	    .range(['#DAF7A6', '#FFC300', '#FF5733', '#C70039',
              '#900C3F', '#581845', '#117a65', '#d68910',
              '999933', '#996699', ]);
	var arc = d3.arc()
	    .outerRadius(radius - 10)
		.innerRadius(0);
	var labelArc = d3.arc()
	    .outerRadius(radius - 70)
		.innerRadius(radius - 70);

    var pie = d3.pie()
    .sort(null)
    .value(function(d) {
      return d;
    });
	d3.selectAll("svg>*").remove();
	var svg = d3.select('#visContainer')
		    .append("svg")
			.style('position','absolute')
	    	.attr('height', height+margin.top+margin.bottom) //can adjust size as desired
	    	.attr('width', width+margin.left+margin.right)
		  .append("g")
			.attr("transform", "translate("+width/2+","+height/2+")")
          //.style('border','1px solid gray'); //comment out to remove border
	var g = svg.selectAll(".arc")
	    .data(pie(dataset))
	  .enter().append("g")
	    .attr("class","arc")
	g.append("path")
	 .attr("d",arc)
	 .style("fill", function(d,i){return color(i);})
	 .style("opacity", "0.85");
	g.on("mouseover", function(d){
		d3.select(this).style("opacity", "0.4");
	}).on("mouseout", function(d){
		d3.select(this).style("opacity","1.0");
	});
	g.append("text")
	 .attr("transform", function(d){return "translate(" + labelArc.centroid(d)+")";})
	 .attr("dy", ".50em")
	 .data(labelset)
	 .text(function(d){return d;})
	 .style("fill","white")
	 .style("font-size", "13px")
	 .style("font-weight","bold")
	 .on("mouseover", function(d){
		 d3.select(this).style("fill", "black").style("font-size", "20px");
	 })
	 .on("mouseout", function(d){
		 d3.select(this).style("fill", "white").style("font-size", "13px");
	 });
}



function load_tweet(username) {
    if (username == 'sample') {
        show_emotion_data(analyze_tweets(SAMPLE_TWEETS));
        draw_Pie_Chart(analyze_tweets(SAMPLE_TWEETS));
    }
    else {
        d3.request("https://faculty.washington.edu/joelross/proxy/twitter/timeline/?screen_name=" + username + "&count=50")
        .mimeType("application/json")
        .response(function(xhr) { return JSON.parse(xhr.responseText); })
        .get(function(data) {
            show_emotion_data(analyze_tweets(data));
            draw_Pie_Chart(analyze_tweets(data));
        });
    }
}

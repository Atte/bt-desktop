require('../styles/berrymotes.core.css')
require('../styles/berrymotes.invert.css')

let {EmoteMap} = require("emotes")
let SuperAgent = require("superagent")
let ee = require("event-emitter")

let tagRegexes = {"fs":"fluttershy","pp":"pinkiepie","aj":"applejack","r":"rarity","ts":"twilightsparkle","rd":"rainbowdash","mane6":"fluttershy|pinkiepie|rarity|applejack|twilightsparkle|rainbowdash","main6":"fluttershy|pinkiepie|rarity|applejack|twilightsparkle|rainbowdash","cmc":"scootaloo|sweetiebelle|applebloom"}

var map, rawEmotes

let Bem = ee({
	dataRefresh: function(){
		let url = "https://cdn.berrytube.tv/berrymotes/data/berrymotes_json_data.v2.json"
		SuperAgent.get(url)
		.end((err, res) => {
			rawEmotes = res.body
			rawEmotes.forEach((em) => {
				let img = em["background-image"]
				if(img && img.indexOf("//") === 0) {
					em["background-image"] = `https:${img}`
				}
			})
			map = new EmoteMap(rawEmotes)
			this.map = map
			this.emit("update")
		})
	},
	map,
	applyEmotesToStr: function(str){ return str},
	findEmote: function(emoteId){
		return map && map.findEmote(emoteId)
	},
	// @TODO Direct port from berrymotes, rewrite or move into EmoteMap
	searchEmotes: function(term, includeNSFW) {
		var searchResults = []

		let isSFWOrNSFWAllowed = (emote) => !emote.nsfw || includeNSFW

		if (!term) {
			return rawEmotes.filter(isSFWOrNSFWAllowed)
		} else {
			var searchBits = term.split(" ")
			var tags = []
			var srs = []
			var terms = []
			var scores = {}
			var srRegex = /^([-+]?sr:)|([-+]?[/]?r\/)/i
			var tagRegex = /^[-+]/i

			var sdrify = function (str) {
				return new RegExp("^" + str, "i")
			}

			for (var i = 0; i < searchBits.length; ++i) {
				var bit = searchBits[i].trim()
				if (bit.match(srRegex)) {
					var trim = bit.match(srRegex)[0].length
					if (bit[0] == '-' || bit[0] == '+') {
						srs.push({match: bit[0] != '-', sdr: sdrify(bit.substring(trim))})
					} else {
						srs.push({match: true, sdr: sdrify(bit.substring(trim))})
					}
				} else if (bit.match(tagRegex)) {
					trim = bit.match(tagRegex)[0].length
					var tag = bit.substring(trim)
					var tagRegex = tag in tagRegexes ? sdrify(tagRegexes[tag]) : sdrify(tag)
					tags.push({match: bit[0] != '-', sdr: tagRegex})
				} else {
					terms.push({
						any: new RegExp(bit, 'i'),
						prefix: sdrify(bit),
						exact: new RegExp('^' + bit + '$')
					})
				}
			}

			var max = rawEmotes.length
			for (var i = 0; i < max; ++i) {
				var emote = rawEmotes[i]
				if (!isSFWOrNSFWAllowed(emote)) { continue }
				var negated = false
				for (var k = 0; k < srs.length; ++k) {
					var match = emote.sr.match(srs[k].sdr) || []
					if (match.length != srs[k].match) {
						negated = true
					}
				}
				if (negated) continue
				if (tags.length && (!emote.tags || !emote.tags.length)) continue
				if (emote.tags && tags.length) {
					for (var j = 0; j < tags.length; ++j) {
						var tagSearch = tags[j]
						var match = false;
						for (var k = 0; k < emote.tags.length; ++k) {
							var tag = emote.tags[k]
							var tagMatch = tag.match(tagSearch.sdr) || []
							if (tagMatch.length) {
								match = true
							}
						}
						if (match != tagSearch.match) {
							negated = true
							break
						}
					}
				}
				if (negated) continue
				if (terms.length) {
					for (var j = 0; j < terms.length; ++j) {
						var term = terms[j]
						var match = false
						for (var k = 0; k < emote.names.length; ++k) {
							var name = emote.names[k]
							if (name.match(term.exact)) {
								scores[i] = (scores[i] || 0.0) + 3
								match = true;
							} else if (name.match(term.prefix)) {
								scores[i] = (scores[i] || 0.0) + 2
								match = true
							} else if (name.match(term.any)) {
								scores[i] = (scores[i] || 0.0) + 1
								match = true
							}
						}
						for (var k = 0; k < emote.tags.length; k++) {
							var tag = emote.tags[k]
							if (tag.match(term.exact)) {
								scores[i] = (scores[i] || 0.0) + 0.3
								match = true;
							} else if (tag.match(term.prefix)) {
								scores[i] = (scores[i] || 0.0) + 0.2
								match = true;
							} else if (tag.match(term.any)) {
								scores[i] = (scores[i] || 0.0) + 0.1
								match = true
							}
						}
						if (!match) {
							delete scores[i]
							negated = true
							break
						}
					}
					if (negated) continue
					//if (Bem.debug) console.log('Matched emote, score: ', emote, scores[i]);
				} else {
					scores[i] = 0
				}
			}
			searchResults = searchResults.concat(Object.keys(scores));
			searchResults.sort(function (a, b) {
				return scores[b] - scores[a]
			})
		}

		return searchResults.map((emoteIdx) => rawEmotes[emoteIdx].names[0])
	}
})

Bem.dataRefresh()
module.exports = Bem

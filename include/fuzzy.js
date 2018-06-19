/*
 * Copyright 2018 Marc Feeley
 *
 * -- CodeBoot Fuzzy Search --
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its contributors
 * may be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER INxk
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

const MAX_FUZZY_MATCH = 3;

function fuzzy_search(text, search) {

    var match = {score:0, match:text};
    var pos = 0;

    text = text.toLowerCase();
    search = search.toLowerCase();

    /* Calculate score base on fuzzy match */
    for (var i=0; i < text.length && pos < search.length; ++i) {

	if (text[i] === search[pos]) {

	    match.score += search.length - (i - pos);
	    ++pos;
	}
    }


    /* Remove score base on length text difference */
    match.score -= Math.abs(text.length - search.length);

    return match;
};



CodeBoot.prototype.fuzzySearch = function (name) {

    var possible_match = Object.keys(cb.globalObject);

    var matchs = [];

    var min_score = 1;

    possible_match.forEach(function (pm) {

	var match = fuzzy_search(pm, name);

	if (match.score >= min_score) {
	    min_score = match.score;
	    matchs.push(match);
	}
    });


    /* Sort match by their score */
    matchs.sort(function (x, y) { return y.score - x.score; });


    return matchs.map(function(m) { return m.match;}).slice(0, MAX_FUZZY_MATCH);
};


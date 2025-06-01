var question_access_array = new Array(8192);
var Note;
var Answer;
var gl_question_counter = 0;
var gl_exercise_counter = 0;
var gl_unit_counter = 0;
var gl_units_array = {}; // units accessed by unit_idx

// set the language
var gl_current_language_set = gl_language_resources[gl_default_language];

var parts_letter_arr = ['A','B','C','D','E'];

/* Create array from topic_arr */
Array.prototype.sort.call( topics_arr, function( a, b ) {
	return a.unit > b.unit ? 1 : 0;
});

var topic_arr_r = new Array(146);

for ( var key in topics_arr ) {
	
	topic_arr_r[ key ] = {};
	
	for ( var key2 in topics_arr[key].parts ) {
	
		topic_arr_r[key][key2] = topics_arr[key].parts[key2];
		
	}

}

console.log( "questions_arr length : " + Object.keys(questions_arr).length ); // for test

Array.prototype.sort.call( questions_arr, function( a, b ) {
	return a.unit > b.unit ? 1 : 0;
});

for ( var idx_unit in questions_arr ) {

	var v_exercises_set = questions_arr[idx_unit].exercises;
	
	for ( var exercises_cntr in v_exercises_set ) {
		
		var v_current_exercise_obj = v_exercises_set[exercises_cntr];
		
		for ( var questions_cntr in v_current_exercise_obj.questions ) {
		
			var question = outcome = v_current_exercise_obj.questions[questions_cntr].Q;
			var question_ru = v_current_exercise_obj.questions[questions_cntr].QFR;
			var note = v_current_exercise_obj.questions[questions_cntr].N;
			if ( note === "" ) { note = undefined;}
			var answers_arr = v_current_exercise_obj.questions[questions_cntr].A;
			
			for ( var answer_cntr = 0 ; answer_cntr < answers_arr.length; answer_cntr++ ) {
		
				outcome = outcome.replace("*" + ( answer_cntr + 1 ) + "*", /*'&lt;' +*/ ' ' + '<div class="class01">' + answers_arr[answer_cntr][0] + '</div>' + ' ' /*+ '&gt;'*/ );

			}
			
			if ( note !== undefined ) {
			
				outcome = outcome + 
				'<span class="question-hint-cls">' + 
					'<span class="question-hint-mark-cls">' + gl_current_language_set.question_hint_mark_word + '</span>' + ' ' /* a space is mandatory to prevent a hovered hint mark sitting close to the right side of the screen to move to the next row and spoil everything */ + 
					'<span class="question-hint-content-cls" data-hint="' + note + '"></span>' +
					'<span class="question-hint-content-cls" data-hint="' + question_ru + '"></span>' +
				'</span>';
			
			}
		
			v_current_exercise_obj.questions[questions_cntr].outcome = outcome;
			
			if ( v_current_exercise_obj.questions[questions_cntr].T !== undefined ) {
			
				v_current_exercise_obj.questions[questions_cntr].TI = topic_arr_r[key][v_current_exercise_obj.questions[questions_cntr].T];
			
			}
			
			//console.log ( questions_arr[key].exercises[exercises_cntr].questions[questions_cntr].TI ); // for test
		}			 
		
	}

} // for

console.log ("The job's finished"); // for test

onload = function()
{ 
	// set default language strings
	document.getElementById("main-header-id").innerHTML = gl_current_language_set.main_header;
	document.getElementById("version-text-id").innerHTML = gl_current_language_set.version_word;
	
	v_contents_view = document.getElementById("contents-view");

	// fill the table of contents in contents-view div
	// fill gl_units_array
	for (var key in gl_sections_array) {

		console.log (gl_sections_array[key].section_name[gl_default_language]); // for test
		
		var v_unit_section_line_div = document.createElement('div');
		v_unit_section_line_div.setAttribute('class','section-line');
		v_unit_section_line_div.innerHTML = gl_sections_array[key].section_name[gl_default_language];
		v_contents_view.appendChild(v_unit_section_line_div);
		
		for ( var unit_key in gl_sections_array[key]["units"] ) {
		
			console.log ('     ' + gl_sections_array[key]["units"][unit_key].topic[gl_default_language] ); // for test
		
			v_unit = unit_key.substr(5);
			v_topic = gl_sections_array[key]["units"][unit_key].topic[gl_default_language];

			var v_unit_content_line_div = document.createElement('div');
			v_unit_content_line_div.setAttribute('class','content-line');
			v_unit_content_line_div.innerHTML = 
				'<a href="#' + v_unit + '" name="cnt-' + v_unit + '" onclick="return closeNav();">' +
				gl_current_language_set.unit_word + ' ' + v_unit + '. ' + v_topic +
				'</a>';
			v_contents_view.appendChild(v_unit_content_line_div);
			
			// fill gl_units_array - the primary key is unit_idx
			gl_units_array[unit_key] = {}
			gl_units_array[unit_key].section_idx = key;
			gl_units_array[unit_key].section_name = gl_sections_array[key].section_name;
			gl_units_array[unit_key].topic = gl_sections_array[key]["units"][unit_key].topic;

		}
	}
	
	v_exercise_view = document.getElementById('exercise-view');	
	
	// Fill main 
	for ( var idx_unit in questions_arr ) {

		gl_unit_counter++;
		
		//if ( gl_unit_counter > 3 ) { break; } // for test // for the time while developing and testing
		
		var v_unit_num = idx_unit.substr(5); // get only digit number
		var v_topic_text = gl_units_array[idx_unit].topic[gl_default_language];
		
		var v_exercises_set_obj = questions_arr[idx_unit].exercises;
		
		// link to a chapter
		var v_unit_chapter_link = document.createElement('a');
		v_unit_chapter_link.setAttribute('name', v_unit_num);
		v_exercise_view.appendChild(v_unit_chapter_link)
		
		// new chapter
		var v_unit_chapter_div = document.createElement('div');
		v_unit_chapter_div.setAttribute('class','unit');
		v_exercise_view.appendChild(v_unit_chapter_div);
		v_unit_topic_left = document.createElement('div');
		v_unit_topic_left.setAttribute('class','topic-left');
		v_unit_topic_left.innerHTML += '<b>' + gl_current_language_set.unit_word + '&nbsp;' + v_unit_num.replace(/^0+/, '') + '&nbsp;' + v_topic_text + '.</b>';				
		v_unit_chapter_div.appendChild(v_unit_topic_left);
		v_unit_goto_top = document.createElement('div');
		v_unit_goto_top.setAttribute('class','content-right');
		v_unit_goto_top.innerHTML = '<a href="#' + 'cnt-' + v_unit_num + '" onclick="return openNav();">' + gl_current_language_set.table_of_contents_word + '</a>';
		v_unit_chapter_div.appendChild(v_unit_goto_top);
	
		var v_unit_div = document.createElement('div');
		v_unit_div.setAttribute('class','unit-cls');
		v_exercise_view.appendChild(v_unit_div);
	
		for ( var exercises_cntr in v_exercises_set_obj ) {
	
			gl_exercise_counter++;
			
			var v_exercise_obj = v_exercises_set_obj[exercises_cntr];
			var v_exercise_num = v_exercise_obj.exercise;
			
			
			var v_exercise_description_text = v_exercise_obj.description;
			
			
			
			v_exercise_description_text = v_exercise_description_text.replace( /\*\*\*/g, '<span class="description-gap-cls">___</span>');

			var v_exercise_div = document.createElement('div');
			v_exercise_div.setAttribute('class','exercise-cls');
			v_unit_div.appendChild(v_exercise_div);
			
			var elem = document.createElement('div');
			elem.setAttribute('class','exercise');
			v_exercise_div.appendChild(elem);	
			elem.innerHTML = "Exercise&nbsp;" + v_exercise_num + '.';
			
			var elem = document.createElement('div');
			elem.setAttribute('class','description');
			v_exercise_div.appendChild(elem);	
			elem.innerHTML = v_exercise_description_text;

			var v_table = document.createElement('table');
			v_exercise_div.appendChild(v_table);
			
			var counter = 1;
			
			for ( var questions_cntr in v_exercise_obj.questions ) { 

				gl_question_counter++;
				
				v_outcome = v_exercise_obj.questions[questions_cntr].outcome;
				
				var row = document.createElement("TR");
				v_table.appendChild(row);

				// Создаем ячейки в вышесозданной строке добавляем тх
				var td1 = document.createElement("TD");
				td1.setAttribute('class','question-num-cls');
				var td2 = document.createElement("TD");
				var td3 = document.createElement("TD");
				var td4 = document.createElement("TD");

				// Наполняем ячейки
				td1.innerHTML = counter++;
				td2.innerHTML = '<div class="question-cls">' + v_outcome + '</div>';
				td3.innerHTML = '<a href="javascript:void(0);"><img /></a>';
				td4.innerHTML = '<select  style="font-size:x-large;"><option>A</option><option>B</option><option>C</option><option>D</option><option>E</option></select>';
				
				/* the code is wrong after changes. It is needing refactoring
				var v_select = td4.getElementsByTagName("select")[0];
				v_select.selectedIndex = parts_letter_arr.indexOf(v_exercise_obj.questions[questions_cntr].T);
				v_select.onchange = (function(){ 
					var v_key = key;
					var v_exercise_num = exercises_cntr;
					var v_question = questions_cntr;
					return function(){
						console.log(this.value); 
						questions_arr[v_key].exercises[v_exercise_num].questions[v_question].T = this.value;
						questions_arr[v_key].exercises[v_exercise_num].questions[v_question].TI = topic_arr_r[v_key][this.value];
					}
				})();
				*/
				
				td3.getElementsByTagName("IMG")[0].setAttribute ( 'src', 'icons/textbookicon_32.png' );
				
				td3.getElementsByTagName("IMG")[0].onclick = (function() { 
					var v_key = key;
					var v_exercise_num = exercises_cntr;
					var v_question = questions_cntr;
					return function(){ 
						showArticle ( v_key, v_exercise_num, v_question );
					} 
				} )();
				
				row.appendChild(td1);
				row.appendChild(td2);
				//row.appendChild(td4); // version for users
				//row.appendChild(td3); // version for users
				
			}
			
		}
		
	}
	
	document.getElementById("unit_statistics_text").innerHTML = gl_current_language_set.statistics_words.units;
	document.getElementById("unit_counter_id").innerHTML = gl_unit_counter;
	document.getElementById("exercise_statistics_text").innerHTML = gl_current_language_set.statistics_words.exercises;
	document.getElementById("exercise_counter_id").innerHTML = gl_exercise_counter;
	document.getElementById("question_statistics_text").innerHTML = gl_current_language_set.statistics_words.questions;	
	document.getElementById("question_counter_id").innerHTML = gl_question_counter;	
	
//document.body.onmouseover = document.body.onmouseout = handler; // commented in v.2

}

function showArticle( p_unit_idx, p_exercise_idx, p_question_idx ){

	var v_question_node = questions_arr[p_unit_idx].exercises[p_exercise_idx].questions[p_question_idx];
	
	var v_outcome = v_question_node.Q;
	
	for ( var answer_cntr = 0 ; answer_cntr < v_question_node.A.length; answer_cntr++ ) {

		var v_outcome = v_outcome.replace("*" + ( answer_cntr + 1 ) + "*", '<b>' + v_question_node.A[answer_cntr][0] + '</b>' );

	}	

	document.getElementById('id_question_text').innerHTML = v_outcome;
		
	document.getElementById('id_topic_img').setAttribute('src','./images/' + v_question_node.TI );

	document.getElementById('parent_popup_click1').style.display='block';

}

function hideArticle(){
	
	document.getElementById('parent_popup_click1').style.display='none';

}

function handler(event) {
		
  function str(el) {
	if (!el) return "null"
	return el.className || el.tagName;
  }

/*
  log.value += event.type + ': ' +
	'target=' + str(event.target) +
	' , relatedTarget=' + str(event.relatedTarget) + "\n";
  log.scrollTop = log.scrollHeight;
*/

/*
  if (event.type == 'mouseover' && str(event.target) == 'class01') {
	var x = event.target.parentElement.getElementsByClassName('class01');
	var i;
	for (i = 0; i < x.length; i++) {
	x[i].style.color = "black";
	}
  }
*/		  
/*	  
  if (event.type == 'mouseover') {
	event.target.style.background = 'pink'
  }
*/	  
/*	
  if (event.type == 'mouseout' && str(event.target) == 'class01') {
	//event.target.style.background = ''
	//event.target.style.color = "white";
	event.target.style.color = event.target.style.background;
	var x = event.target.parentElement.getElementsByClassName('class01');
	var i;
	for (i = 0; i < x.length; i++) {
	x[i].style.color = event.target.style.background;
	}
  }
*/		  
}

function download() {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent( JSON.stringify( questions_arr ) ));
  element.setAttribute('download', 'tmp_questions_arr.js');

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}


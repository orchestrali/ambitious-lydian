var numbells = 6;
var soundurl = "https://cdn.glitch.com/f57f3c90-9d92-4d19-a328-37edc3c48815%2F";
var bells = [{
    "bell": "c5",
    "viewbox": "0 0 100 100",
    "url": "bell60.wav"
  },
  {
    "bell": "d5",
    "viewbox": "-3 -4 106 106",
    "url": "bell62.wav"
  },
  {
    "bell": "e5",
    "viewbox": "-6 -8 112 112",
    "url": "bell64.wav"
  },
  {
    "bell": "f5",
    "viewbox": "-8 -10 116 116",
    "url": "bell65.wav"
  },
  {
    "bell": "g5",
    "viewbox": "-10 -14 120 120",
    "url": "bell67.wav"
  },
  {
    "bell": "a5",
    "viewbox": "-12 -17 124 124",
    "url": "bell69.wav"
  },
  {
    "bell": "b5",
    "viewbox": "-14 -20 128 128",
    "url": "bell71.wav"
  },
  {
    "bell": "c6",
    "viewbox": "-15 -21 130 130",
    "url": "bell72.wav"
  },
  {
    "bell": "d6",
    "viewbox": "-17 -24 134 134",
    "url": "bell74.wav"
  },
  {
    "bell": "e6",
    "viewbox": "-19 -26 138 138",
    "url": "bell76.wav"
  },
  {
    "bell": "f6",
    "viewbox": "-20 -28 140 140",
    "url": "bell77.wav"
  },
  {
    "bell": "g6",
    "viewbox": "-22 -31 144 144",
    "url": "bell79.wav"
  },
  {
    "bell": "a6",
    "viewbox": "-24 -34 148 148",
    "url": "bell81.wav"
  },
  {
    "bell": "b6",
    "viewbox": "-26 -36 152 152",
    "url": "bell83.wav"
  },
  {
    "bell": "c7",
    "viewbox": "-27 -37 154 154",
    "url": "bell84.wav"
  },
  {
    "bell": "d7",
    "viewbox": "-29 -40 158 158",
    "url": "bell86.wav"
  }];
var duration = 1.3;
var width = 60;
var mybell = 3;
var mybells = [5,6];
var level = 0;
var audioCtx;
var gainNode;
var instructions;
var rowArr = [];
var rownum = 0;
var myrow = 0;
var place = 0;
var speed = 2.0;
var delay = speed/(numbells);
var stroke = 1;
var playing = false;
var nextBellTime = 0.0;
var mynexttime = 0.0;
var myqueue = [];
var timeout;
let lookahead = 5.0;
let schedule = 0.02;
var thatsall = false;
var callqueue = [];
var soundqueue = [];
var lastplayed = -1;
var waitgaps;
var waiting = false;
var timeout;
var lastcall;
var lastcallrow;
var roundscount = 0;
var stoprounds = 1;
var numrounds = 0;
var ringtiming;
var feedback = false;
var displayplace = false;

for (let i = 0; i < bells.length; i++) {
  bells[i].type = "handbell";
  bells[i].url = soundurl + bells[i].url;
}

$(function() {
  console.log("hello world :o");
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.75;
  setupSample(0);
  setupRopes(numbells);
  $.getJSON("levels.js", function(data) {
    instructions = data;
    console.log(instructions.length);
  }).fail(function( jqxhr, textStatus, error ) {
    var err = textStatus + ", " + error;
    console.log( "Request Failed: " + err );
});
  
  
  $("#startbutton").on("click", function() {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    $("#beginning").hide();
    $("#container").show();
  });
  
  $("#nextbutton").on("click", function() {
    level++;
    if (instructions[level]) levelup();
  });
  
  
});

function levelup() {
  $("h3").text("Level "+level);
  let o = instructions[level];
  if (o.mybells && o.mybells[0] != mybells[0]) {
    assign(o.mybells);
  }
  if (o.rowArr) {
    rowArr = o.rowArr;
  }
  if (o.button) { //this is actually just when getting to level 1...
    if ($("#displayfeedback").length) {
      $('label[for="displayfeedback"]').remove();
    } else {
      $("#nextbutton").detach();
      $("#buttons").prepend(...o.button);
      $("#okbutton").on("click", function() {
        if (!playing) {
          $("#okbutton").addClass("disabled");
          $("#stopbutton").removeClass("disabled");
          treblesgoing();
        }
      });
      $("#stopbutton").on("click", function() {
        if (playing) {
          thatisall();
        }
      });
      $("#backbutton").on("click", function() {
        level--;
        if (instructions[level]) {
          if (level === 0) {
            $("#backbutton,#okbutton,#stopbutton").detach();
          }
          levelup();
        }
      });
      $("#nextbutton").on("click", function() {
        level++;
        if (instructions[level]) levelup();
      });
    }
    
  }
  if (level === 2 && !$("#displayfeedback").length) {
    $("#instructions p").after('<label for="displayfeedback"><input type="checkbox" id="displayfeedback" name="displayfeedback" checked />show feedback</label>');
    $("#displayfeedback").on("click", function() {
      feedback = $("#displayfeedback").prop("checked");
    });
  }
  if (level === 12 && !$("#displayplace").length) {
    $("#instructions p").after('<label for="displayplace"><input type="checkbox" id="displayplace" name="displayplace" />display the place to ring in in real time</label>');
    $("#displayplace").on("click", function() {
      displayplace = $("#displayplace").prop("checked");
    });
  }
  if (o.rowzero) {
    buildrows(o);
  }
  $("#instructions p").text(o.instructions);
}

function buildrows(o) {
  let rz = o.rowzero;
  let pn = o.placenotation;
  let arr = [{row: []}, {row: []}];
  if (o.stoprounds) {
    stoprounds = o.stoprounds;
  }
  if (o.numrounds) {
    numrounds = o.numrounds;
    for (let i = 2; i < o.numrounds; i++) {
      arr.push({row: []});
    }
  }
  arr.forEach(r => {
    for (let i = 0; i < numbells; i++) {
      r.row.push([rz[i][0]]);
    }
  });
  if (o.firstcall) {
    arr[arr.length-2].call = o.firstcall;
  }
  let row = rz;
  let l = 0;
  do {
    for (let i = 0; i < pn.length; i++) {
      let next = [];
      let dir = 1;
      for (let p = 0; p < numbells; p++) {
        if (pn[i] === "x" || !pn[i].includes(p+1)) {
          next.push([row[p+dir][0]]);
          dir *= -1;
        } else {
          next.push([row[p][0]]);
        }
      }
      arr.push({row: next});
      row = next;
      //console.log(next);
    }
    l++;
  } while (!arr[arr.length-1].row.every((a,i) => a[0] === i+1) && l < 12);
  rowArr = arr;
}

function treblesgoing() {
  //console.log("starting play");
  playing = true;
  nextBellTime = audioCtx.currentTime;
  
  if (rownum === 0 && mybells.includes(1)) {
    waiting = true;
    requestAnimationFrame(animate);
  } else {
    waiting = false;
    mynexttime = audioCtx.currentTime + (mybell-1)*delay;
    if (rownum === 0) {
      place = -2, mynexttime += 2*delay;
      myqueue = [{stroke: 1, time: mynexttime},{stroke: -1, time: mynexttime+speed-.23*duration}];
    }
    scheduler();
    requestAnimationFrame(animate);
  }
}

function nextPlace() {
  nextBellTime += delay;
  place++;
  
  if (place === numbells) {
    //console.log("finished with row "+rownum);
    if (stroke === -1) nextBellTime += delay; //add handstroke gap
    place = 0;
    stroke *= -1;
    rownum++;
    let call = rownum < rowArr.length && rowArr[rownum].call ? rowArr[rownum].call : " ";
    
    if (rowArr[rownum+1] || level === 1 || roundscount < stoprounds) {
      let p1 = level === 1 ? mybell-1 : rowArr[rownum] ? findplace(rownum) : findplace(numrounds);
      let p2 = level === 1 ? mybell-1 : rowArr[rownum+1] ? findplace(rownum+1) : rowArr[rownum] ? findplace(numrounds) : findplace(numrounds+1);
      let diff = p2 - p1;
      let time = myqueue[myqueue.length-1].time + speed + diff*delay;
      if (stroke === -1) time += delay;
      myqueue.push({stroke: stroke*-1, time: time});
    }
    
    if (rownum === rowArr.length-2) {
      roundscount++;
      if (roundscount === stoprounds) {
        thatsall = true;
        call = "That's all";
      }
    }
    
    
    if (rownum === rowArr.length) {
      
      if (!thatsall) {
        if ([1,2].includes(level)) {
          roundscount++;
          if (roundscount === 3) {
            thatsall = true;
            call = "That's all";
          }
        }
        rownum = numrounds;
        console.log(rownum);
        rowArr.forEach(o => {
          o.row.forEach(a => {
            a[1] = false;
          });
        });
      } else {
        call = "thatsall";
      }
    }
    
    callqueue.push({call: call, time: nextBellTime + delay, rownum: rowArr.length*roundscount + rownum});
    
  }
  
  
}

function scheduleRing(p, t) {
  if (p > -1) {
    let num = rowArr[rownum].row[p];
    let bell = num && num.length && !mybells.includes(num[0]);
    
    if (bell) {
      soundqueue.push({bell: num[0], stroke: stroke, time: t, place: p});
      ring(num[0], t);
    }
    if (rownum === 0 && p === 0 && roundscount === 0) {
      callqueue.push({call: "", time: t, rownum: rownum});
    }
    
    if (!bell && waitgaps && (!num || !num[1])) {
      waiting = t;
    } else {
      nextPlace();
    }
    
  } else {
    let call = p === -2 ? "Look to" : "Treble's going";
    callqueue.push({call: call, time: t, rownum: rownum});
    nextPlace();
  }
}

function scheduler() {
  while (nextBellTime < audioCtx.currentTime + schedule && rowArr[rownum] && !waiting) {
    scheduleRing(place, nextBellTime);
  }
  !waiting && rowArr[rownum] ? timeout = setTimeout(scheduler, lookahead): clearTimeout(timeout);
}

function animate() {
  let currentTime = audioCtx.currentTime;
  let call = lastcall;
  let callrow = lastcallrow;
  let move = lastplayed;
  let last;
  
  while (soundqueue.length && soundqueue[0].time < currentTime) {
    move = soundqueue[0].place;
    last = soundqueue.shift();
  }
  if (move != lastplayed) {
    let bell = bells.find(b => b.num === last.bell);
    //console.log("moving "+bell.num);
    let angle = last.stroke === 1 ? 45 : 145;
    let transform = (numbells >= 10 ? "scale(0.8) " : "") + "rotate("+(bell.left > 300 ? -1*angle+"deg)" : angle+"deg)");
    $("#rope"+bell.num).css("transform", transform);
    lastplayed = move;
  }
  
  while (callqueue.length && callqueue[0].time < currentTime) {
    call = callqueue[0].call;
    callrow = callqueue[0].rownum;
    callqueue.shift();
  }
  if ((call != lastcall || callrow != lastcallrow) && call != "thatsall") {
    $("#callcontainer").text(call);
    lastcall = call;
    lastcallrow = callrow;
  }
  if (call === "thatsall") {
    thatisall();
  }
  if (myqueue[0] && myqueue[0].early && myqueue[0].time < currentTime) {
    myqueue.shift();
  }
  
  requestAnimationFrame(animate);
  
}

function thatisall() {
  playing = false;
  waiting = false;
  clearTimeout(timeout);
  setTimeout(function() {
    standbells(1);
  }, 500);
  
  $("#okbutton").removeClass("disabled");
  $("#stopbutton").addClass("disabled");
  rownum = 0;
  place = 0;
  myrow = 0;
  roundscount = 0;
  thatsall = false;
  lastplayed = -1;
  stroke = 1;
  rowArr.forEach(o => {
    o.row.forEach(a => {
      a[1] = false;
    });
  });
  $("#instruct").text(" ");
}



var listeners = [
  {id: "rope", event: "mouseover", f: pointer},
  {id: "rope", event: "click", f: triggerpull},
  {id: "rope", event: "touchstart", f: triggerpull},
  {id: "rope", event: "touchend", f: prevent},
  //{id: "hand15b", event: "endEvent", f: hidefeedback},
  //{id: "back14b", event: "endEvent", f: hidefeedback}
]

function setupRopes(n) {
  let start = 3;
  let th = Math.PI / numbells;
  let xx = [];
  let yy = [];
  let m = 1;
  let c = [10,12].includes(numbells) ? 240 : [14,16].includes(numbells) ? 280 : 200;

  do {
    xx.push(c*Math.sin(m*th));
    yy.push(c*Math.cos(m*th));
    m += 2;
  } while (m*th < Math.PI/2);
  if (m*th === Math.PI/2) {
    xx.push(c);
    yy.push(0);
  }
  
  let k = 0;
  for (let i = 0; i < n; i++) {
    let num = start + i;
    if (num > n) num -= n;
    let j = n - num;
    let bell = bells[j];
    
    bell.num = num;
    bell.stroke = 1;
    if (i < numbells / 4) {
      bell.left = 300 + xx[k];
      bell.top = 300 - yy[k];
      i+1 >= numbells/4 ? (numbells%4 === 0 ? k*=1 : k--) : k++;
    } else if ( i < numbells / 2) {
      bell.left = 300 + xx[k];
      bell.top = 300 + yy[k];
      if (k > 0) k--;
    } else if (i < 3*numbells/4) {
      bell.left = 300 - xx[k];
      bell.top = 300 + yy[k];
      i+1 >= 3*numbells/4 ? (numbells%4 === 0 ? k*=1 : k--) : k++;
    } else {
      bell.left = 300 - xx[k];
      bell.top = 300 - yy[k];
      if (k > 0) k--;
    }
    addbell(bell, i);
    bellnums(bell);
    
    
  }
  
  mybells.forEach(b => {
    listeners.forEach(l => {
      document.getElementById(l.id+b).addEventListener(l.event, l.f);
    });
  });
  
  $("body").on("keydown", function(e) {
    if (e.key === "j") {
      pull(mybells[0]);
    } else if (e.key === "f") {
      pull(mybells[1]);
    }
  });
  $("#bells").append('<div id="callcontainer"></div>', '<div id="instruct"></div>', '<div id="feedback"></div>');
  $("#instructions p").text("Welcome to bell master! Ring the 5 and 6, the two bells at the bottom of the screen, by clicking on them OR hitting the 'j' and 'f' keys on your keyboard.");
}

//add bell number next to the bell
function bellnums(bell) {
  let left = bell.left > 300 ? bell.left + 120 : 820-bell.left;
  let hemi = bell.left > 300 ? " right" : " left";
  let side = hemi === " right" ? "left:" : "right:"
  let top = bell.top + 5;
  let elem = `<div class="bellnum rope${bell.num + hemi}" style="${side}${left}px;top:${top}px;">${bell.num}</div>`;
  $("#bells").append(elem);
}

function assign(arr) {
  
  listeners.forEach(o => {
    mybells.forEach(mybell => {
      document.getElementById(o.id+mybell).removeEventListener(o.event, o.f);
    });
    arr.forEach(n => {
      document.getElementById(o.id+n).addEventListener(o.event, o.f);
    });
  });
  
  let coords = [];
  $(".bellnum").remove();
  for (let i = 0; i < numbells; i++) {
    let o = {left: bells[i].left, top: bells[i].top};
    coords.push(o);
  }
  let offset = arr[0] - mybells[0];
  if (offset < 0) offset += numbells;
  while (offset > 0) {
    coords.push(coords.shift());
    offset--;
  }
  for (let i = 0; i < numbells; i++) {
    bells[i].left = coords[i].left;
    bells[i].top = coords[i].top;
    let angle = (bells[i].stroke === 1 ? 145 : 45) * (bells[i].left > 300 ? -1 : 1);
    let transform = (numbells >= 10 ? "scale(0.8) " : "") + "rotate("+angle+"deg)";
    $("#rope"+bells[i].num).attr("style", "left:"+coords[i].left+"px;top:"+coords[i].top+"px;transform:"+transform+";");
    bellnums(bells[i]);
  }
  
  mybells = arr;
}

function remove(e) {
  if (e) {
    e.removeEventListener("click", triggerpull);
    e.removeEventListener("mouseenter", pointer);
  }
}

function hidefeedback(e) {
  $("#feedback").css("opacity","0");
}

async function getFile(audioContext, filepath) {
  const response = await fetch(filepath);
  const arrayBuffer = await response.arrayBuffer();
  return arrayBuffer;
}

async function setupSample(i) {
  let arrayBuffer = await getFile(audioCtx, bells[i].url);
  audioCtx.decodeAudioData(arrayBuffer, (buffer) => {
    bells[i].buffer = buffer;
    if (i < bells.length-1) {
      i++;
      setupSample(i);
    } else {
      console.log("finished setting up");

    }
  }, (e) => { console.log(e) });
}

function pointer(e) {
  let num = Number(this.id.slice(4));
  if (mybells.includes(num)) {
    this.style.cursor = "pointer";
  } else {
    this.style.cursor = "auto";
  }
}

function prevent(e) {
  e.preventDefault();
}

function triggerpull(e) {
  let n = Number(this.id.slice(4));
  let bell = bells.find(b => b.num === n);
  if (bell) {
    pull(n);
  }
}

function pull(n, t) {
  let bell = bells.find(b => b.num === n);
  let now = audioCtx.currentTime;
  let rn = myrow+1;
  
  let angle = bell.stroke === 1 ? 45 : 145;
  let transform = (numbells >= 10 ? "scale(0.8) " : "") + "rotate("+(bell.left > 300 ? -1*angle+"deg)" : angle+"deg)");
  $("#rope"+bell.num).css("transform", transform);
  
  ring(bell.num);
  bell.stroke *= -1;
  
  let row = rowArr[myrow];
  if (row && mybells.includes(n)) {
    if (n === 1 && waiting && rownum === 0) {
      myqueue = [{stroke: -1, time: now+speed}];
    } else if (myqueue.length && feedback) {
      //console.log(myqueue[0]);
      let diff = myqueue[0].time - now;
      if (Math.abs(diff) < .1) {
        ringtiming = "Good!";
        myqueue.shift();
      } else if (diff > 0) {
        ringtiming = "Early";
        myqueue[0].early = true;
      } else {
        ringtiming = "Late";
        myqueue.shift();
      }
      $("#feedback").text(ringtiming);
      $("#feedback").css("opacity", "1");
      //console.log(ringtiming);
    }
    let i = row.row.findIndex(a => a[0] === n);
    if (!row.row[i][1] && ((myrow%2 === 0 && bell.stroke === -1) || (myrow%2 === 1 && bell.stroke === 1))) {
      row.row[i][1] = true;
    } else if (rowArr[myrow+1] && ((myrow%2 === 0 && bell.stroke === 1) || (myrow%2 === 1 && bell.stroke === -1))) {
      let j = rowArr[myrow+1].row.findIndex(a => a[0] === n);
      if (j > -1 && !rowArr[myrow+1].row[j][1]) {
        rowArr[myrow+1].row[j][1] = true;
        rn += 1;
      }
    }
    if (displayplace) {
      if (rn === rowArr.length) rn = numrounds;
      console.log(rn);
      let p = findplace(rn);
      let text;
      switch (p) {
        case undefined:
          text = "???";
          break;
        case 0:
          text = "Lead";
          break;
        case 1:
          text = "2nd";
          break;
        case 2:
          text = "3rd";
          break;
        default:
          text = (p+1)+"th";
      }
      text += `<br/>` + (rn % 2 === 0 ? "handstroke" : "backstroke");
      $("#instruct").html(text);
    }
    myrow++;
    if (myrow === rowArr.length) myrow = numrounds;
  }
  
  if (waiting) {
    waiting = false;
    nextBellTime = Math.max(audioCtx.currentTime, nextBellTime);
    scheduler();
  }
}
function standbells(n) {
  if (bells) {
    for (let i = 1; i <= numbells; i++) {
      let bell = bells.find(b => b.num === i);
      if (bell.stroke !== n) {
        pull(i);
      }
    }
  }
}

function findplace(rn) {
  let p;
  if (rowArr[rn]) {
    p = rowArr[rn].row.findIndex(a => a[0] === mybell);
  }
  return p;
}

function endpull(e) {
  let bellnum = Number(this.id.slice(7));
  let bell = bells.find(o => o.num === bellnum);
  if (bell) {
    bell.ringing = false;
  }
}

//given bellnum find the buffer to play
function ring(bellnum, t) {
  //console.log(this.id);
  let bell = bells.find(b => b.num === bellnum);
  if (bell) {
    let pan = [];
    let x = (Number(bell.left) - 270)/135;
    let z = Number(bell.top)/100;
    pan.push(x, 10, z);
    let buffer = bell.buffer;
    playSample(audioCtx, buffer, t ? t : audioCtx.currentTime, pan);
  }
}


//play sound
function playSample(audioContext, audioBuffer, t, pan) {
  //console.log("playSample called");
  //console.log(audioBuffer);
  const sampleSource = audioContext.createBufferSource();
  sampleSource.buffer = audioBuffer;
  const panner = audioContext.createPanner();
  panner.panningModel = 'equalpower';
  panner.setPosition(...pan);
  sampleSource.connect(panner).connect(gainNode).connect(audioContext.destination);
  //sampleSource.connect(audioContext.destination);
  sampleSource.start(t);
  return sampleSource;
}


function addbell(bell, i) {
  let transform = (numbells >= 10 ? "scale(0.8) " : "") + "rotate("+(i < numbells/2 ? "-145deg)" : "145deg)");
  let elem = `
  <div class="bell ${bell.bell}" id="rope${bell.num}" style="left:${bell.left}px;top:${bell.top}px;transform:${transform}">
    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100" height="100" viewBox="${bell.viewbox}">
      <path d="M10,5
               H90
               q -20 20, -20 60
               q -20 10, -40 0
               q 0 -40, -20 -60" stroke-width="2" stroke="black" />
    </svg>
    <div class="base"></div>
    <div class="handle"></div>
  </div>`;
  $("#bells").append(elem);
}

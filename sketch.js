//Video and posenet
let poseNet;
let poses = [];
let video;
let canvasWidth=720;
let canvasHeight=canvasWidth*0.75;
//let canvasHeight=canvasWidth*9/16; //Height depends on width: to preserve the usual ratio 16:9.
//to have width depend on height instead, put the formula in the other variable and make the fraction 16/9 instead.
let wristDiameter=40;

//Tone js
let music_keys = []
let num_of_keys = 8
let synth;
let notes = ["C4", "D4", "D#4", "F4", "G4", "A4", "B4", "C5"]; // This is a simple major scale
let lastNoteTime = 0;
let noteInterval = 500; // One note per second

let keyDimension = 50;
let radiusKeys = canvasHeight*0.5 - keyDimension;

let centerX = canvasWidth*0.5;
let centerY = canvasHeight*0.5;

var keyAngle;

//MIDI sending...
let output;
let channel_midi;

let a_ch = 72;
let b_ch = 73;
let c_ch = 74;
let d_ch = 75;


function setup() {
  //Create canvas
  createCanvas(canvasWidth, canvasHeight);
  video = createCapture(VIDEO);
  video.size(canvasWidth,canvasHeight);
  video.hide();

  // Create objects for notes
  for (let i = 0; i < num_of_keys; i++) {
    keyAngle = 2*PI/num_of_keys*i
    music_keys.push(new MusicKey(centerX+radiusKeys*cos(keyAngle), centerY+radiusKeys*sin(keyAngle), i)); //locate them in a circle
  }
  // synth = new Tone.PolySynth().toMaster();


  //create posenet
  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on('pose', function(results) {
    poses = results;
  });

  WebMidi.enable(function(err) { //check if WebMidi.js is enabled
  if (err) {
    console.log("WebMidi could not be enabled.", err);
  } else {
    console.log("WebMidi enabled!");
  }

    //name our visible MIDI input and output ports
  console.log("---");
  console.log("Inputs Ports: ");
  for (i = 0; i < WebMidi.inputs.length; i++) {
    console.log(i + ": " + WebMidi.inputs[i].name);
  }

  console.log("---");
  console.log("Output Ports: ");
  for (i = 0; i < WebMidi.outputs.length; i++) {
    console.log(i + ": " + WebMidi.outputs[i].name);
  }

  output = WebMidi.outputs[2];
  channel_midi = output.channels[1];


  //channel_midi.sendControlChange(72, 64);





});
}


function draw() {

  //flip everything
  translate(width, 0);
  scale(-1, 1);

  //video.size(640,480);
  //video.hide();
  image(video, 0, 0, width, height);

  drawPoseParts();



  //display all music keys
  for (let i = 0; i < num_of_keys; i++) {
    music_keys[i].display();
  }

  send_signal()

}

//making wrist check for playing
function send_signal(){
   for (let i = 0; i < poses.length; i++) {
     for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
       let keypoint = poses[i].pose.keypoints[j];

      print(keypoint.position.y)
       if ((keypoint.part=="leftWrist" ) && keypoint.score > 0.2) {
         channel_midi.sendControlChange(a_ch, keypoint.position.y/canvasHeight*170);
         channel_midi.sendControlChange(b_ch, keypoint.position.x/canvasWidth*170);

       } //keypoint score and wrist test close

       if ((keypoint.part=="rightWrist" ) && keypoint.score > 0.2) {
         channel_midi.sendControlChange(c_ch, keypoint.position.y/canvasHeight*170);
         channel_midi.sendControlChange(d_ch, keypoint.position.x/canvasWidth*170);

       } //keypoint score and wrist test close
     } // 'j' for loop close
   } // 'i' for loop close
} //check_wrist_inside function close


function drawPoseParts(){
  for (let i = 0; i < poses.length; i++) {
    let p = poses[i].pose;
    if (p.leftWrist.confidence > 0.2){
      fill(color("red"));
      noStroke();
      ellipse(p.leftWrist.x, p.leftWrist.y, wristDiameter, wristDiameter);
    }
    if (p.rightWrist.confidence > 0.2){
      fill(color("red"));
      noStroke();
      ellipse(p.rightWrist.x, p.rightWrist.y, wristDiameter, wristDiameter);
    }
  }
}

// Music Key class
class MusicKey {
  constructor(xpos, ypos, note_index) {
    this.x = xpos;
    this.y = ypos;
    this.note_index = note_index;
    // let r = this.note_index/num_of_keys * 255 - 80
    // let g = this.note_index/num_of_keys * 255 - 170
    // let b = this.note_index/num_of_keys * 255
    // this.key_color = color(r, g, b, 150);
    // this.key_color_triggered = color(r + 150, g+150, b*0, 250);
    this.key_color = color("yellow")
    this.key_color_triggered = color("red")
    this.xDimension = keyDimension;
    this.yDimension = keyDimension;
    this.mouse_inside = false;
    this.wrist_inside = false;
    this.overlapTolerance = wristDiameter*0.5; //making the overlap space bigger than actual key
  }


 //making wrist check for playing
  check_wrist_inside(){
    for (let i = 0; i < poses.length; i++) {
    for (let j = 0; j < poses[i].pose.keypoints.length; j++) {
      let keypoint = poses[i].pose.keypoints[j];

      if ((keypoint.part=="leftWrist" || keypoint.part=="rightWrist") && keypoint.score > 0.2) {
    if (
      keypoint.position.x >= this.x- this.overlapTolerance && //this.x is the square
      keypoint.position.x <= this.x + this.xDimension + this.overlapTolerance &&
      keypoint.position.y >= this.y - this.overlapTolerance &&
      keypoint.position.y <= this.y + this.yDimension + this.overlapTolerance
     )
    {//do following:
    this.wrist_inside=true;
      }
    else {
      this.wrist_inside=false;
        }
      } //keypoint score and wrist test close
    } // 'j' for loop close
  } // 'i' for loop close
} //check_wrist_inside function close


  check_mouse_inside(){
    if (
      mouseX >= this.x &&
      mouseX <= this.x + this.dimension &&
      mouseY >= this.y &&
      mouseY <= this.y + this.dimension
    //making wrist check for playing

    ) {
      this.mouse_inside = true;
    }
    else {
      this.mouse_inside = false;
    }
  }

  display() { //for music keys class, called for all keys
    //this.check_mouse_inside();
    this.check_wrist_inside();
    if (this.wrist_inside) {
      fill(this.key_color_triggered)
      if (millis() - lastNoteTime > noteInterval) {
//         const fmSynth = new Tone.FMSynth().toMaster();
// fmSynth.triggerAttackRelease(notes[this.note_index], "2n");
//
        //synth.triggerAttackRelease(notes[this.note_index], "1");
        lastNoteTime = millis();
      }
    }
    else{
      fill(this.key_color);
    }
    rect(this.x-this.xDimension*0.5, this.y-this.yDimension*0.5, this.xDimension, this.yDimension);
  }


}

function modelReady() {
  console.log("Model Ready!");
}

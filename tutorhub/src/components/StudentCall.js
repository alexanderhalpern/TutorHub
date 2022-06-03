import React from "react";
import { BallTriangle } from "react-loader-spinner";

function StudentCall({
  receivingCall,
  callAccepted,
  className,
  answerCall,
  stream,
  myVideo,
  userVideo,
  callEnded,
  inputs,
  MIDINoteLog,
  Piano,
  activeNotes,
  name,
  leaveCall,
  setRequested,
  setClassName,
}) {
  return (
    <div className="w-screen h-screen text-black">
      {!receivingCall && !callAccepted && (
        <div>
          <h1>Connecting you with a teacher for help with {className}</h1>

          <div className="flex w-full justify-center mb-8 items-center">
            <BallTriangle
              height="100"
              width="100"
              color="black"
              ariaLabel="loading"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col justify-center text-black">
        {receivingCall && !callAccepted && (
          <div className="flex justify-center">
            <div className="flex flex-row items-center">
              A Teacher Accepted your Request for your Help
              <button
                onClick={answerCall}
                className="bg-blue-500 ml-4 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full"
              >
                Join
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-row justify-center">
          {stream && (
            <video
              width={500}
              className="rounded-3xl m-10 mb-2"
              playsInline
              muted
              ref={myVideo}
              autoPlay
            />
          )}
          {callAccepted && !callEnded && (
            <video
              width={500}
              className="rounded-3xl m-10 mb-2"
              playsInline
              ref={userVideo}
              autoPlay
            />
          )}
        </div>
        {inputs.length > 0 && (
          <div className="flex flex-row m-auto justify-center items-center">
            <MIDINoteLog input={inputs[0]} />
            <Piano
              noteRange={{ first: 60, last: 88 }}
              playNote={(midiNumber) => {
                // play the wav file associated
                // with the midi note number
                if (midiNumber >= 60 && midiNumber <= 72) {
                  const audio = new Audio(
                    require(`../audio/${midiNumber}.wav`)
                  );
                  console.log(audio);
                  audio.play();
                }
              }}
              stopNote={(midiNumber) => {}}
              width={500}
              keyboardShortcuts={false}
              activeNotes={activeNotes}
            />
          </div>
        )}
        {receivingCall && !callAccepted && (
          <div className="flex justify-center">
            <div className="flex flex-col items-center">
              <h1 className="text-4xl font-bold text-white">
                {name} is calling you
              </h1>
            </div>
          </div>
        )}
        <div className="w-full justify-center mb-2">
          {callAccepted && !callEnded && (
            <button
              onClick={() => leaveCall("")}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 mr-4 rounded"
            >
              Leave Call
            </button>
          )}
          <button
            onClick={() => {
              setRequested(false);
              setClassName("");
            }}
            className="border-4 p-4 w-40 rounded-full mt-6 shadow-lg bg-gray-500"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentCall;

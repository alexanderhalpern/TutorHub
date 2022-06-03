import { useState, useEffect, useRef } from "react";
import logo from "./logo.svg";
//import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import { BallTriangle } from "react-loader-spinner";
import Peer from "simple-peer";
import io from "socket.io-client";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  onValue,
  ref,
  child,
  push,
  remove,
} from "firebase/database";
import "./App.css";
import { useMIDI, useMIDINote } from "@react-midi/hooks";
import { Piano, MidiNumbers } from "react-piano";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import "react-piano/dist/styles.css";

const socket = io.connect("http://192.168.1.19:5000");

const firebaseConfig = require("./firebaseConfig.json");

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [activeNotes, setActiveNotes] = useState([]);
  const [name, setName] = useState("");
  const [admin, setAdmin] = useState(true);
  let { inputs, outputs, hasMIDI } = useMIDI();
  const [subjectTeaching, setSubjectTeaching] = useState("Math");
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    // fetch the items from the database
    // fetch every second
    const interval = setInterval(() => {
      const entries = ref(db);
      onValue(entries, (snapshot) => {
        // remove the entry with the same id
        const newQueue = [];
        snapshot.forEach((entry) => {
          newQueue.push(entry.val());
        });
        setQueue(newQueue);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    console.log(inputs);
  }, [inputs]);

  useEffect(() => {
    console.log(activeNotes);
  }, [activeNotes]);

  const MIDINoteLog = ({ input }) => {
    const event = useMIDINote(input, { channel: 1 }); // Intially returns undefined
    if (!event) {
      return <div></div>;
    }
    const { on, note, velocity, channel } = event;
    if (admin) {
      let newActiveNotes = [...activeNotes];
      if (velocity > 0) {
        newActiveNotes.push(note);
        setActiveNotes(newActiveNotes);
      } else {
        // remove note from activeNotes
        newActiveNotes = newActiveNotes.filter((note) => note !== note);
        setActiveNotes(newActiveNotes);
      }
      socket.emit("activeNotes", {
        activeNotes: JSON.stringify(newActiveNotes),
      });
    }

    // send the updated activeNotes array to the server

    return <div></div>;
  };

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [requested, setRequested] = useState(false);
  const [user, setUser] = useState();
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.addScope(
    "https://www.googleapis.com/auth/classroom.courses.readonly"
  );

  const googleSignIn = () => {
    signInWithPopup(auth, provider).then((result) => {
      console.log(result);
      setUser(result.user);
    });
  };

  // initialize realtime db

  const db = getDatabase(app);
  // useEffect(() => {
  //   // add to db with dictionary entry
  //   console.log("className", className);

  //   if (className === "") {
  //     // remove from db
  //     // find db entry that contains className = className
  //     // delete that entry
  //     console.log("in here removing")
  //     const entries = ref(db, 'waiting');
  //     onValue(entries, (snapshot) => {
  //       // remove the entry with the same id
  //       snapshot.forEach(entry => {
  //         if (entry.val().id === me) {
  //           remove(entry.ref);
  //         }
  //       });
  //     });
  //   } else {
  //     console.log("im in here adding")
  //     push(ref(db, `waiting`), {
  //       name: name,
  //       className: className,
  //       subject: subject,
  //       id: me
  //     });
  //   }
  // }, [className]);

  const addToQueue = () => {
    // add entry to /waiting with random key
    push(ref(db), {
      name: user.displayName,
      className: className,
      subject: subject,
      id: me,
    });
  };

  const removeFromQueue = () => {
    // const entries = ref(db);
    //   onValue(entries, (snapshot) => {
    //     // remove the entry with the same id
    //     snapshot.forEach(entry => {
    //       if (entry.val().id === me) {
    //         remove(entry.ref);
    //       }
    //     });
    //   });
  };

  useEffect(() => {
    console.log(subject);
    console.log(className);
  }, [subject, className]);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        myVideo.current.srcObject = stream;
      });
  }, [requested, user]);

  useEffect(() => {
    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    console.log("admin", admin);
    if (!admin) {
      socket.on("activeNotesRemote", (data) => {
        console.log("-------");
        console.log("admin is ", admin);
        console.log("receiving notes", data.activeNotes);
        console.log("-------");

        // make sure different sender
        if (data.activeNotes) {
          setActiveNotes(JSON.parse(data.activeNotes));
        }
      });
    }
  }, [admin]);

  useEffect(() => {
    if (user?.email === "halperna22@gmail.com") {
      setAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    console.log("callAccepted: ", callAccepted);
    console.log("receivingCall: ", receivingCall);
    console.log("idToCall: ", idToCall);
  }, [callAccepted, receivingCall, idToCall]);

  const callUser = (id) => {
    console.log("calling user: ", id);
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });
    socket.on("callAccepted", (signal) => {
      setCallAccepted(true);
      peer.signal(signal);
    });

    connectionRef.current = peer;
  };

  const answerCall = () => {
    setCallAccepted(true);
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });
    peer.on("signal", (data) => {
      socket.emit("answerCall", { signal: data, to: caller });
    });
    peer.on("stream", (stream) => {
      userVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = (id) => {
    setCallEnded(true);
    // remove the firstbase entry with the same id
    console.log("ending call", id);
    if (id !== "") {
      const entries = ref(db, "/");
      onValue(entries, (snapshot) => {
        // remove the entry with the same id
        snapshot.forEach((entry) => {
          if (entry.val().id === id) {
            remove(entry.ref);
          }
        });
      });
    }

    connectionRef.current.destroy();
  };

  const subjectColors = {
    Math: "blue",
    English: "red",
    Science: "green",
    History: "purple",
    Geography: "yellow",
    "Computer Science": "orange",
  };

  useEffect(() => {
    console.log(subject);
  }, [subject]);

  return (
    <div className="App bg-gradient-to-r from-blue-800 to-orange-800">
      <header className="App-header">
        {!user ? (
          <div className="flex flex-col items-center justify-center h-screen">
            <div className="flex flex-col items-center justify-center h-screen">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={() => {
                  googleSignIn();
                }}
              >
                Sign In With Google
              </button>
            </div>
          </div>
        ) : !admin ? (
          <div>
            <div className="flex bg-white drop-shadow-2xl p-12 rounded-3xl">
              {subject === "" && (
                <div className="">
                  <h1 className="font-bold text-black text-3xl">
                    What subject would you like help with?
                  </h1>
                  <div>
                    <button
                      onClick={() => setSubject("Math")}
                      value="Math"
                      className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-blue-500"
                    >
                      Math
                    </button>
                    <button
                      onClick={() => setSubject("English")}
                      className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-red-500"
                    >
                      English
                    </button>
                    <button
                      onClick={() => setSubject("Science")}
                      className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-green-500"
                    >
                      Science
                    </button>
                  </div>
                  <div>
                    <button
                      onClick={() => setSubject("History")}
                      className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-purple-500"
                    >
                      History
                    </button>
                    <button
                      onClick={() => setSubject("Geography")}
                      className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-yellow-500"
                    >
                      Geography
                    </button>
                    <button
                      onClick={() => setSubject("Computer Science")}
                      className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-orange-500"
                    >
                      Computer Science
                    </button>
                  </div>
                </div>
              )}
              {subject != "" && className == "" && (
                <div className="">
                  <h1 className="text-black">
                    What class would you like help with?
                  </h1>
                  <div className="flex flex-col mt-4">
                    <button
                      onClick={() => setClassName(subject + " 108")}
                      className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}
                    >
                      {subject} 108
                    </button>
                    <button
                      onClick={() => setClassName(subject + " 110")}
                      className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}
                    >
                      {subject} 110
                    </button>
                    <button
                      onClick={() => setClassName(subject + " 211")}
                      className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}
                    >
                      {subject} 211
                    </button>
                    <button
                      onClick={() => setClassName(subject + " 304")}
                      className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}
                    >
                      {subject} 304
                    </button>
                  </div>
                  <button
                    onClick={() => setSubject("")}
                    className="border-4 p-4 w-30 rounded-full mt-6 shadow-lg bg-gray-500"
                  >
                    Back
                  </button>
                </div>
              )}
              {className !== "" && (
                <div className="flex flex-col mt-2">
                  {requested ? (
                    <div className="w-screen h-screen text-black">
                      {!receivingCall && !callAccepted && (
                        <div>
                          <h1>
                            Connecting you with a teacher for help with{" "}
                            {className}
                          </h1>

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
                                    require(`./audio/${midiNumber}.wav`)
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
                              removeFromQueue();
                            }}
                            className="border-4 p-4 w-40 rounded-full mt-6 shadow-lg bg-gray-500"
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h1 className="text-black">
                        Request help from a teacher that specializes in your
                        subject area?
                      </h1>
                      <div className="flex justify-center w-full flex-row">
                        <button
                          onClick={() => {
                            setRequested(true);
                            addToQueue();
                          }}
                          className="border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-gray-500"
                        >
                          Request Help
                        </button>
                        <button
                          onClick={() => {
                            setRequested(false);
                            setClassName("");
                            removeFromQueue();
                          }}
                          className="border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-gray-500"
                        >
                          Back
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            {/* dropdown of subjects */}

            <div className="flex flex-col text-black">
              <div className="flex flex-row justify-center">
                {stream && (
                  <video
                    width={500}
                    className="rounded-3xl m-10"
                    playsInline
                    muted
                    ref={myVideo}
                    autoPlay
                  />
                )}
                {callAccepted && !callEnded && (
                  <video
                    width={500}
                    className="rounded-3xl m-10"
                    playsInline
                    ref={userVideo}
                    autoPlay
                  />
                )}
              </div>
              {inputs.length > 0 && (
                <div className="flex flex-row m-auto justify-center items-center">
                  <MIDINoteLog className="hidden" input={inputs[0]} />
                  <Piano
                    noteRange={{ first: 60, last: 88 }}
                    playNote={(midiNumber) => {
                      // play the wav file associated
                      // with the midi note number
                      if (midiNumber >= 60 && midiNumber <= 72) {
                        const audio = new Audio(
                          require(`./audio/${midiNumber}.wav`)
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
            </div>

            {/* <select
              onChange={(e) => setSubjectTeaching(e.target.value)}
              className="border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-gray-500"
            >
              <option value="">Select a subject</option>
              <option selected value="Math">
                Math
              </option>
              <option value="Science">Science</option>
              <option value="English">English</option>
              <option value="Eistory">History</option>
              <option value="Spanish">Spanish</option>
              <option value="Other">Other</option>
            </select> */}

            {/* show queue items where subject = subjectTeaching*/}
            {queue
              .filter((item) => item.subject === subjectTeaching)
              .map((item) => (
                <div className="flex flex-col mb-10 items-center justify-center">
                  <div className="flex flex-row">
                    <h2 className="text-4xl font-bold text-white m-4">
                      {item.name} is requesting help with {item.className}
                    </h2>
                    {callAccepted && !callEnded ? (
                      <button
                        onClick={() => leaveCall(item.id)}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Leave Call
                      </button>
                    ) : (
                      <button
                        onClick={() => callUser(item.id)}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      >
                        Accept Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            {queue.filter((item) => item.subject === subjectTeaching).length ===
              0 && (
              <div className="flex flex-col items-center justify-center">
                <h1 className="text-4xl mb-10 font-bold text-white">
                  No one is requesting help for {subjectTeaching}
                </h1>
              </div>
            )}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

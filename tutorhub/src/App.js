import { useState, useEffect, useRef } from "react";
//import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import Peer from "simple-peer";
import io from "socket.io-client";
import { initializeApp } from "firebase/app";
import { getDatabase, onValue, ref, push, remove } from "firebase/database";
import "./App.css";
import { useMIDI, useMIDINote } from "@react-midi/hooks";
import { Piano } from "react-piano";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import Auth from "./components/Auth";
import ChooseSubject from "./components/ChooseSubject";
import "react-piano/dist/styles.css";
import ChooseClass from "./components/ChooseClass";
import StudentCall from "./components/StudentCall";
import StudentMakeRequest from "./components/StudentMakeRequest";

const socket = io.connect("localhost:5000");

const firebaseConfig = require("./firebaseConfig.json");

function App() {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [activeNotes, setActiveNotes] = useState([]);
  const [name, setName] = useState("");
  const [admin, setAdmin] = useState(true);
  let { inputs } = useMIDI();
  const [subjectTeaching, setSubjectTeaching] = useState("Math");
  const [queue, setQueue] = useState([]);
  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [requested, setRequested] = useState(false);
  const [user, setUser] = useState();
  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.addScope(
    "https://www.googleapis.com/auth/classroom.courses.readonly"
  );

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
  });

  useEffect(() => {
    console.log(inputs);
  }, [inputs]);

  useEffect(() => {
    console.log(activeNotes);
  }, [activeNotes]);

  const MIDINoteLog = ({ input }) => {
    const event = useMIDINote(input, { channel: 1 }); // Intially returns undefined
    if (!event) return;
    const { note, velocity } = event;
    if (admin) {
      let newActiveNotes = [...activeNotes];
      if (velocity > 0) {
        newActiveNotes.push(note);
        setActiveNotes(newActiveNotes);
      } else {
        // remove note from activeNotes
        newActiveNotes = newActiveNotes.filter(
          (noteChild) => noteChild !== note
        );
        setActiveNotes(newActiveNotes);
      }
      socket.emit("activeNotes", {
        activeNotes: JSON.stringify(newActiveNotes),
      });
    }
    return;
  };

  const googleSignIn = () => {
    signInWithPopup(auth, provider).then((result) => {
      console.log(result);
      setUser(result.user);
    });
  };

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

  const addToQueue = () => {
    push(ref(db), {
      name: user.displayName,
      className: className,
      subject: subject,
      id: me,
    });
  };

  useEffect(() => {
    console.log("callAccepted: ", callAccepted);
    console.log("receivingCall: ", receivingCall);
  }, [callAccepted, receivingCall]);

  useEffect(() => {
    if (user?.email === "halperna22@gmail.com") {
      setAdmin(false);
    }
  }, [user]);

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

  return (
    <div className="App bg-gradient-to-r from-blue-800 to-orange-800">
      <header className="App-header">
        {!user ? (
          <Auth googleSignIn={googleSignIn} />
        ) : !admin ? ( // if student
          <div>
            <div className="flex bg-white drop-shadow-2xl p-12 rounded-3xl">
              {subject === "" && <ChooseSubject setSubject={setSubject} />}
              {subject !== "" && className === "" && (
                <ChooseClass
                  subject={subject}
                  setClassName={setClassName}
                  setSubject={setSubject}
                />
              )}
              {className !== "" && (
                <div className="flex flex-col mt-2">
                  {requested ? (
                    <StudentCall
                      receivingCall={receivingCall}
                      callAccepted={callAccepted}
                      className={className}
                      answerCall={answerCall}
                      stream={stream}
                      myVideo={myVideo}
                      userVideo={userVideo}
                      callEnded={callEnded}
                      inputs={inputs}
                      MIDINoteLog={MIDINoteLog}
                      Piano={Piano}
                      activeNotes={activeNotes}
                      name={name}
                      leaveCall={leaveCall}
                      setRequested={setRequested}
                      setClassName={setClassName}
                    />
                  ) : (
                    <StudentMakeRequest
                      setRequested={setRequested}
                      addToQueue={addToQueue}
                      setClassName={setClassName}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // if tutor
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

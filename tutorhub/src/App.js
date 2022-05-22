import { useState, useEffect, useRef } from 'react';
import logo from './logo.svg';
//import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import { BallTriangle } from  'react-loader-spinner'
import Peer from "simple-peer";
import io from "socket.io-client";
import './App.css';

const socket = io.connect("http://localhost:5000");

function App() {

  const [me, setMe] = useState("");
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [name, setName] = useState("");

  const myVideo = useRef();
  const partnerVideo = useRef();
  const connectionRef = useRef();


  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      setStream(stream);
      myVideo.current.srcObject = stream;
    });

    socket.on("me", (id) => {
      setMe(id);
    });

    socket.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setName(data.name);
      setCallerSignal(data.signal);
    });

  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });
  
    peer.on("signal", data => {
      socket.emit("callUser", { userToCall: id, signalData: data, from: me, name: name });
    });

    peer.on("stream", stream => {
      partnerVideo.current.srcObject = stream;
    });

    peer.on("callAccepted", signal => {
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
  
    peer.on("signal", data => {
      socket.emit("answerCall", { to: caller, signal: data });
    });

    peer.on("stream", stream => {
      partnerVideo.current.srcObject = stream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  const leaveCall = () => {
    setCallEnded(true);
    connectionRef.current.destroy();
  };


  const subjectColors = {
    "Math": "blue",
    "English": "red",
    "Science": "green",
    "History": "purple",
    "Geography": "yellow",
    "Computer Science": "orange",
  }

  useEffect(() => {
    console.log(subject);
  }, [subject]);

  
  return (
    <div className="App bg-gray-200">
      <header className="App-header">
        <div className="flex border-8 border-black bg-gradient-to-r from-cyan-500 to-blue-500 shadow-2xl p-24 rounded-3xl">
          {stream && <video playsInline muted ref={myVideo} autoPlay />}
          {callAccepted && !callEnded && <video playsInline ref={partnerVideo} autoPlay />}
          {me}
          {(subject == "") && (
          <div className="">
            <h1>
              What subject would you like help with?
            </h1>
            <div>
              <button onClick={() => setSubject("Math")} value = "Math" className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-blue-500">
                Math
              </button>
              <button onClick={() => setSubject("English")} className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-red-500">
                English
              </button>
              <button onClick={() => setSubject("Science")} className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-green-500">
                Science
              </button>
            </div>
            <div> 
              <button onClick={() => setSubject("History")} className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-purple-500">
                History
              </button>
              <button onClick={() => setSubject("Geography")} className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-yellow-500">
                Geography
              </button>
              <button onClick={() => setSubject("Computer Science")} className="border-4 p-4 w-30 rounded-full m-10 shadow-lg bg-orange-500">
                Computer Science
              </button>
            </div>
          </div>
          )}
          {(subject != "") && (className == "") && (
          <div className="">
            <h1>
              What subject would you like help with?
            </h1>
              <div className="flex flex-col mt-4">
                <button onClick={() => setClassName(subject + " 108")} className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}>
                  {subject} 108
                 </button>
                 <button onClick={() => setClassName(subject + " 110")} className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}>
                 {subject} 110
                 </button>
                 <button onClick={() => setClassName(subject + " 211")} className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}>
                 {subject} 211
                 </button>
                 <button onClick={() => setClassName(subject + " 304")} className={`border-4 p-4 w-30 rounded-full m-4 shadow-lg bg-${subjectColors[subject]}-500`}>
                 {subject} 304
                 </button>
              </div>
              <button onClick={() => setSubject("")} className="border-4 p-4 w-30 rounded-full mt-6 shadow-lg bg-gray-500">
                Back
              </button>
          </div>
          )}
          {(className != "") && (
            <div className="flex flex-col mt-4">
              <h1>
                Connecting you with a teacher for help with {className}
              </h1>
              <div className="flex w-full justify-center items-center">
               <BallTriangle
                  height="100"
                  width="100"
                  color='white'
                  ariaLabel='loading'
                />
              </div>
              <button onClick={() => setClassName("")} className="border-4 p-4 w-30 rounded-full mt-6 shadow-lg bg-gray-500">
                Back
              </button>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;

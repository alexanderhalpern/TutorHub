import React from "react";

function ChooseSubject({ setSubject }) {
  return (
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
  );
}

export default ChooseSubject;

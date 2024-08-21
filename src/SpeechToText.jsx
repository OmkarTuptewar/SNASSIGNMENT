import React, { useState, useRef } from "react";

const SpeechToText = () => {
  const [status, setStatus] = useState("Not Connected");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    if (!MediaRecorder.isTypeSupported("audio/webm")) {
      alert("Browser not supported");
      return;
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });
    mediaRecorderRef.current = mediaRecorder;

    const socket = new WebSocket("wss://api.deepgram.com/v1/listen", [
      "token",
      "7374d7090286b0933306741ab40ec25db706165f",
    ]);
    socketRef.current = socket;

    socket.onopen = () => {
      setStatus("Connected");
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0 && socket.readyState === 1) {
          socket.send(event.data);
        }
      });
      mediaRecorder.start(1);
    };

    socket.onmessage = (message) => {
      const received = JSON.parse(message.data);
      const newTranscript = received.channel.alternatives[0].transcript;
      if (newTranscript && received.is_final) {
        setTranscript((prev) => prev + newTranscript + " ");
      }
    };

    socket.onclose = () => {
      setStatus("Disconnected");
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("Error");
    };

    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (socketRef.current) {
      socketRef.current.close();
    }
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-gray-700 to-gray-900 p-4">
  <div className="bg-white shadow-2xl rounded-xl p-8 max-w-lg w-full transform transition-all duration-500 scale-125">
    <p className="text-lg font-extrabold text-gray-700 mb-4" id="status">
      Status: {status}
    </p>
    <div className="bg-gray-100 p-4 rounded-lg h-40 overflow-y-auto mb-4 border-2 border-gray-300">
      <p id="transcript" className="text-gray-800 whitespace-pre-wrap">
        {transcript || "Your transcript will appear here..."}
      </p>
    </div>
    <div className="flex space-x-4">
      <button
        onClick={startRecording}
        disabled={isRecording}
        className={`px-6 py-3 bg-gradient-to-r from-teal-500 to-blue-600 text-white rounded-full font-semibold transform transition-all duration-300 ${
          isRecording ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
        }`}
      >
        Start Recording
      </button>
      <button
        onClick={stopRecording}
        disabled={!isRecording}
        className={`px-6 py-3 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full font-semibold transform transition-all duration-300 ${
          !isRecording ? "opacity-50 cursor-not-allowed" : "hover:scale-105"
        }`}
      >
        Stop Recording
      </button>
    </div>
  </div>
</div>

  );
};

export default SpeechToText;

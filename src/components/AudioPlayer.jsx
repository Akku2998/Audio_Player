import React, { useState, useEffect, useRef } from "react";

const AudioPlayer = () => {
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const request = window.indexedDB.open("audio_playlist", 1);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      db.createObjectStore("audios", { autoIncrement: true });
    };

    request.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction(["audios"], "readonly");
      const objectStore = transaction.objectStore("audios");
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = function (event) {
        setPlaylist(event.target.result);
      };
    };

    request.onerror = function (event) {
      console.log("Error opening IndexedDB database");
    };
  }, []);

  useEffect(() => {
    if (playlist.length > 0) {
      const storedAudio = playlist[currentTrackIndex];
      audioRef.current.src = storedAudio.url;
      console.log("Name..", storedAudio);
      if (isPlaying) audioRef.current.play();
      else audioRef.current.pause();

      audioRef.current.addEventListener("ended", () => {
        if (currentTrackIndex < playlist.length - 1) {
          setCurrentTrackIndex(currentTrackIndex + 1);
        } else {
          setCurrentTrackIndex(0);
        }
      });

      return () => {
        audioRef.current.removeEventListener("ended", () => {});
      };
    }
  }, [playlist, currentTrackIndex, isPlaying]);

  useEffect(() => {
    const lastPlayedIndex = parseInt(localStorage.getItem("lastPlayedIndex"));
    if (!isNaN(lastPlayedIndex)) {
      setCurrentTrackIndex(lastPlayedIndex);
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
      const audioData = event.target.result;
      saveAudioToIndexedDB(audioData);
    };
    reader.readAsDataURL(file);
  };

  const saveAudioToIndexedDB = (audioData) => {
    const request = window.indexedDB.open("audio_playlist", 1);

    request.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction(["audios"], "readwrite");
      const objectStore = transaction.objectStore("audios");
      const addRequest = objectStore.add({ url: audioData });

      addRequest.onsuccess = function () {
        setPlaylist([...playlist, { url: audioData }]);
      };

      addRequest.onerror = function () {
        console.log("Error adding audio to IndexedDB");
      };
    };
  };
  const playTrack = (index) => {
    setCurrentTrackIndex(index);
    if (isPlaying) {
      setIsPlaying(false);
    }
    localStorage.setItem("lastPlayedIndex", index);
  };

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col justify-center items-center">
      <div className="bg-white shadow-md rounded-md p-6 w-full md:w-1/2">
        <div className="flex flex-col justify-center items-center p-8 bg-black rounded-xl mt-4 ">
          <h2 className="text-xl font-bold text-center text-white">
            Now Playing
          </h2>
          <div className="flex flex-col justify-center items-center mt-4 gap-4">
            <audio ref={audioRef} controls onPlay={() => setIsPlaying(true)} />
            <p className="text-xs font-bld text-white">
              {playlist[currentTrackIndex] &&
                `mp3...... ${currentTrackIndex + 1}`}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4">Playlist</h2>
            <ul>
              {playlist.map((track, index) => (
                <li
                  key={index}
                  className="cursor-pointer py-2 px-4 mb-2 bg-gray-200 rounded-md hover:bg-gray-300 transition duration-300 ease-in-out"
                  onClick={() => playTrack(index)}
                >
                  {index + 1}. mp3
                </li>
              ))}
            </ul>
            <div className="flex justify-center item-center mt-8">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                className="hidden"
                id="audio-upload"
              />
              <label
                htmlFor="audio-upload"
                className="block w-80 bg-black text-white rounded-md py-2 px-4 text-center cursor-pointer hover:bg-gray-500 transition duration-300 ease-in-out"
              >
                Upload Audio
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

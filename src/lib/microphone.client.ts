let activeStream: MediaStream | null = null;

export async function requestMicrophoneStream() {
  if (activeStream?.getAudioTracks().some((track) => track.readyState === "live")) {
    return activeStream;
  }

  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("Microphone recording is unavailable", "NotSupportedError");
  }

  activeStream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  return activeStream;
}

export function releaseMicrophoneStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
  if (activeStream === stream) activeStream = null;
}
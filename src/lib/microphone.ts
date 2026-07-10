let activeStream: MediaStream | null = null;

export async function requestMicrophoneStream(): Promise<MediaStream> {
  if (activeStream?.getAudioTracks().some((track) => track.readyState === "live")) {
    return activeStream;
  }

  if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
    throw new DOMException("Microphone recording is unavailable", "NotSupportedError");
  }

  // Keep constraints broad: some mobile browsers reject optional processing
  // constraints even though the device microphone itself works.
  activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return activeStream;
}

export function releaseMicrophoneStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
  if (activeStream === stream) activeStream = null;
}
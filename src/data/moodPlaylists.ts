export interface MoodPlaylistConfig {
  playlistId: string | string[]; // Can be a single song ID, an array of song IDs, or a playlist URL/ID
}

export const moodPlaylists: Record<string, MoodPlaylistConfig> = {
  "in-love": {
    playlistId: [
      "TQqBjSAK52s",
      "KtlgYxa6BMU",
      "DdI598gKkKw",
      "M-Vus7kqy1o",
      "SlbfAYvA_gI",
      "uziIDxPrjJc",
      "6ksOgOnX8q4",
      "OC2o2ElQLDU",
      "VgqxDYFhSng",
      "sZvn_-S24uw",
      "vA86QFrXoho",
      "InF9oLB1j0k",
      "ohx5VxmQCmM",
      "vl8YTnx3gso",
    ],
  },
  "the-weeknd": {
    playlistId: [
      "DgBM12cGM-Q",
      "a40tAP5MC6M",
      "KMZYqDKsKIc",
    ],
  },
  "The-Weekend": {
    playlistId: [
      "DgBM12cGM-Q",
      "a40tAP5MC6M",
      "KMZYqDKsKIc",
    ],
  },
  "one-sided": {
    playlistId: [
      "-BJt4fCAtZE",
      "Bwj6H0NKLMc",
      "fC05FYTHNsY",
      "9B14lTzsShc",
      "WSy0sjZiO8I",
      "MlpG_JAcB2o",
      "45zJNqiANA4",
      "aaYtQCmn_HQ",
      "tYqZK7bq5Bs",
      "cYT325Fe9zU",
      "haIPUUKQOBQ",
      "gJLVTKhTnog",
      "yEJQpoHfw0s",
      "KrJ5c-Egz-U",
      "ZVyA_8rd1Ko",
      "FO9rBogdRRQ",
      "lTzL4Sx8c-o",
      "lnY-RsN1Hr0",
    ],
  },
  "long-distance": {
    playlistId: [
      "TQqBjSAK52s",
      "KtlgYxa6BMU",
      "DdI598gKkKw",
      "SlbfAYvA_gI",
      "uziIDxPrjJc",
      "6ksOgOnX8q4",
      "OC2o2ElQLDU",
      "VgqxDYFhSng",
      "sZvn_-S24uw",
      "vA86QFrXoho",
      "InF9oLB1j0k",
      "ohx5VxmQCmM",
      "vl8YTnx3gso",
    ],
  },
  lonely: {
    playlistId: [
      "2CgESv5CYUw",
      "82vn6VQdGwE",
      "P9L_ZWVPX4g",
      "BLFGsxijRHg",
      "j44dcyPq0M8",
      "7pG5vQpQP5c",
    ],
  },
  "late-night": {
    playlistId: [
      "c-8abSPAPOU",
      "Kf5pXDhx5Vc",
      "MHCsrKA9gh8",
      "ViKbB7vbK7Q",
      "4PgOJwUCdIc",
      "wPY6dOC-MDA",
      "nujn6wbr-e8",
      "wmLGG5DYDWQ",
    ],
  },
};

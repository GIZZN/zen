import { Track } from '../modalalbum/modalalbum';

// Рекомендуемые треки
export const RECOMMENDED_TRACKS: Track[] = [
  { 
    id: 11, 
    title: "Ты любишь танцевать", 
    artist: "Cupsize", 
    duration: "2:25", 
    cover: "/1.png", 
    genre: "Electronic", 
    audioSrc: "/saund/cupsize-ty-ljubish-tancevat.mp3" // поменять на переменную из стореджа
  },
  { 
    id: 12, 
    title: "Я схожу с ума", 
    artist: "Cupsize", 
    duration: "3:08", 
    cover: "/2.png", 
    genre: "Pop", 
    audioSrc: "/saund/cupsize-ja-skhozhu-s-uma.mp3" 
  },
  { 
    id: 13, 
    title: "Папа", 
    artist: "Тёмный Принц", 
    duration: "5:03", 
    cover: "/3.png", 
    genre: "Alternative",
    audioSrc: "/saund/Тёмный Принц - Папа ft Tewiq .mp3"
  },
  { 
    id: 14, 
    title: "Kill Yourself (Part III)", 
    artist: "$uicideboy$", 
    duration: "2:25", 
    cover: "/4.png", 
    genre: "Rap", 
    audioSrc: "/saund/25-28_Hz_uicideboy_-_Kill_Yourself_Part_III_-_Low_Bass_By_Kpaca_Wella_(SkySound.cc).mp3"
  },
  { 
    id: 15, 
    title: "Right Here",
    artist: "lil peep",   
    duration: "2:16", 
    cover: "/5.png", 
    genre: "Alternative Rap",   
    audioSrc: "/saund/lil_peep_-_right_here_(SkySound.cc).mp3"
  },
  { 
    id: 16, 
    title: "Faint", 
    artist: "Linkin Park", 
    duration: "2:36", 
    cover: "/6.png", 
    genre: "Rock", 
    audioSrc: "/saund/Linkin_Park_-_Faint_2003_(SkySound.cc).mp3"
  },
];

// Конфигурация эквалайзера
export const EQUALIZER_CONFIG = {
  BARS_COUNT: 140,
  BASE_ANIMATION_DELAY: 0.05,
  BASE_ANIMATION_DURATION: 1.2,
  ANIMATION_VARIATION: 0.3,
  ANIMATION_VARIATION_STEPS: 5
};

// Настройки плеера
export const PLAYER_CONFIG = {
  DEFAULT_VOLUME: 0.6,
  PROGRESS_UPDATE_INTERVAL: 500,
  DRAG_THRESHOLD: 2
};

// Сообщения для пользователя
export const USER_MESSAGES = {
  NO_TRACKS_FOR_ALBUM: 'У вас пока нет треков в библиотеке',
  ADD_TRACKS_TO_CREATE_ALBUM: 'Добавьте треки из рекомендаций, чтобы создать альбом',
  NO_TRACKS_FOR_PLAYLIST: 'У вас пока нет треков для добавления в плейлист.',
  ADD_TRACKS_TO_CREATE_PLAYLIST: 'Добавьте треки из рекомендаций, чтобы создать плейлист.',
  LIBRARY_EMPTY: 'Ваша библиотека пуста',
  ADD_FROM_RECOMMENDATIONS: 'Добавляйте треки из рекомендаций, чтобы создать свою коллекцию',
  NO_ALBUMS: 'У вас пока нет альбомов',
  CREATE_FIRST_ALBUM: 'Создайте свой первый альбом из любимых треков',
  LYRICS_NOT_AVAILABLE: 'Исполнитель не добавил текст',
  LYRICS_UNAVAILABLE_DESC: 'К сожалению, текст этой песни недоступен',
  SELECT_AT_LEAST_ONE_TRACK: 'Выберите хотя бы один трек для альбома'
};

// Иконки SVG
export const ICONS = {
  PLAY: "M8 5v14l11-7z",
  PAUSE: "M6 19h4V5H6v14zm8-14v14h4V5h-4z",
  PREVIOUS: "M6 6h2v12H6zm3.5 6l8.5 6V6z",
  NEXT: "M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z",
  REPEAT: "M7 7h10v3l4-4-4-4v3H5v6h2V7zM17 17H7v-3l-4 4 4 4v-3h12v-6h-2v4z",
  ADD: "M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  CLOSE: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  DELETE: "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  CHECK: "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z",
  STAR: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  MENU: "M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z",
  COPY: "M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
  SHARE: "M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z",
  VOLUME: "M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z",
  VOLUME_MUTED: "M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z",
  LYRICS: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
  DRAG_HANDLE: "M8 6h2v2H8zm0 4h2v2H8zm0 4h2v2H8zm6-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2z",
  DRAG_LINES: "M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z",
  ARROW_DOWN: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"
};

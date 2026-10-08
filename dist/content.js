(() => {
  "use strict";

  // Personal details for this birthday edition.
  const sister = {
    name: "Doji",
    displayName: "Doji",
    age: 15,
    birthdayDate: "",
  };

  const sender = {
    name: "Your sibling",
    signoff: "With all my love,",
  };

  // EDIT HERE: place JPGs in assets/photos/ and tailor every caption/memory.
  // The nine supplied photos are split between the timeline and scrapbook without
  // duplication. Add more records whenever you add more images.
  const timeline = [
    {
      id: "photo-08",
      path: "assets/photos/photo-08.jpg",
      alt: "The birthday girl smiling indoors in a pink jacket.",
      shortCaption: "An opening chapter",
      videoCaption: "Every story starts with a little spark.",
      longMemory: "The opening chapters: bright smiles, small adventures, and the beginning of everything that makes Doji wonderfully herself.",
      chapterLabel: "Earlier chapters",
      focalPoint: "50% 34%",
      isSample: false,
    },
    {
      id: "photo-07",
      path: "assets/photos/photo-07.jpg",
      alt: "The birthday girl dressed smartly beside a family member.",
      shortCaption: "Growing into herself",
      videoCaption: "Growing into her own light.",
      longMemory: "Year by year, she has become more confident, curious, and unmistakably Doji.",
      chapterLabel: "Growing up",
      focalPoint: "43% 30%",
      isSample: false,
    },
    {
      id: "photo-06",
      path: "assets/photos/photo-06.jpg",
      alt: "The birthday girl with two family members on a bridge over a river.",
      shortCaption: "The family episode",
      videoCaption: "The people who make every chapter warmer.",
      longMemory: "The best scenes are often the ones shared with family—the familiar faces that make every place feel like home.",
      chapterLabel: "Family frames",
      focalPoint: "40% 44%",
      isSample: false,
    },
    {
      id: "photo-04",
      path: "assets/photos/photo-04.jpg",
      alt: "The birthday girl sitting on stone steps beside her sibling under leafy trees.",
      shortCaption: "Sibling scene",
      videoCaption: "Some scenes only siblings understand.",
      longMemory: "A sibling story made of inside jokes, shared adventures, ridiculous moments, and always being on the same team.",
      chapterLabel: "Sibling memories",
      focalPoint: "63% 38%",
      isSample: false,
    },
    {
      id: "photo-03",
      path: "assets/photos/photo-03.jpg",
      alt: "The birthday girl smiling behind her sibling beside the sea.",
      shortCaption: "Right here, right now",
      videoCaption: "Sunlit days and all the stories still ahead.",
      longMemory: "Right here, right now—fifteen on the horizon and a whole new season waiting to unfold.",
      chapterLabel: "Recent moments",
      focalPoint: "62% 48%",
      isSample: false,
    },
  ];

  const scrapbook = [
    {
      id: "photo-01",
      path: "assets/photos/photo-01.jpg",
      alt: "The birthday girl smiling with her arms open in front of a fountain and statue.",
      shortCaption: "Main-character energy",
      videoCaption: "Main-character energy, naturally.",
      longMemory: "A bright moment that feels exactly like Doji: open-hearted, joyful, and ready for whatever comes next.",
      chapterLabel: "A sunny scene",
      focalPoint: "50% 67%",
      isSample: false,
    },
    {
      id: "photo-05",
      path: "assets/photos/photo-05.jpg",
      alt: "The birthday girl holding a camera in a museum garden.",
      shortCaption: "Through her lens",
      videoCaption: "Collecting beauty, one frame at a time.",
      longMemory: "Curious eyes, a camera in hand, and the kind of imagination that notices the lovely details other people miss.",
      chapterLabel: "Little joys",
      focalPoint: "52% 43%",
      isSample: false,
    },
    {
      id: "photo-09",
      path: "assets/photos/photo-09.jpg",
      alt: "The birthday girl smiling with her arms open on a sunny brick street.",
      shortCaption: "Joy, unfiltered",
      videoCaption: "Joy looks good on her.",
      longMemory: "One of those unfiltered, sunshine-filled moments that deserves to live in the scrapbook forever.",
      chapterLabel: "Good days",
      focalPoint: "62% 48%",
      isSample: false,
    },
    {
      id: "photo-02",
      path: "assets/photos/photo-02.jpg",
      alt: "The birthday girl smiling with three family members on a flower-lined street.",
      shortCaption: "All together now",
      videoCaption: "Love is the cast that stays.",
      longMemory: "A favourite kind of frame: everyone together, surrounded by colour, keeping another good day close.",
      chapterLabel: "Family frames",
      focalPoint: "50% 48%",
      isSample: false,
    },
  ];

  // Fifteen notes for fifteen years.
  const messages = [
    { id: "message-01", text: "You make ordinary days feel brighter just by being yourself." },
    { id: "message-02", text: "I love the way your personality makes every room feel more alive." },
    { id: "message-03", text: "Your laugh is one of those sounds that can turn a whole day around." },
    { id: "message-04", text: "I am so lucky that I get to grow through life with you as my sister." },
    { id: "message-05", text: "You have a way of making people feel welcome, seen, and included." },
    { id: "message-06", text: "I admire the courage you show whenever you try something new." },
    { id: "message-07", text: "Life with you is funnier, louder, and a lot more interesting—in the best way." },
    { id: "message-08", text: "Never forget that you are allowed to take up space and dream very big." },
    { id: "message-09", text: "You are becoming more yourself every year, and that is wonderful to watch." },
    { id: "message-10", text: "Thank you for every silly conversation, shared smile, and perfectly ordinary moment." },
    { id: "message-11", text: "I hope fifteen brings you good surprises, kind people, and plenty of reasons to smile." },
    { id: "message-12", text: "Your softness and your strength can exist together; both are part of what makes you special." },
    { id: "message-13", text: "Even when we annoy each other, I will always be on your team." },
    { id: "message-14", text: "You deserve a year that feels warm, exciting, and completely your own." },
    { id: "message-15", text: "No matter how many chapters come next, you will always have a sibling cheering for you." },
  ];

  const letter = {
    isSample: false,
    greeting: "Dear Doji,",
    paragraphs: [
      "Happy fifteenth birthday. Somehow you keep becoming more thoughtful, funny, brave, and wonderfully yourself with every new chapter.",
      "Being your sibling means getting a front-row seat to all the little moments that make you who you are. I hope you always know how loved you are—not only today, but on the quiet days too.",
      "This year, I hope you trust your voice, stay curious, laugh often, and make room for every dream that matters to you. You never have to have everything figured out. Just keep growing at your own pace.",
      "I am proud of you, grateful for you, and always in your corner. Here is to fifteen and to every beautiful scene still waiting for you.",
    ],
  };

  window.BIRTHDAY_CONTENT = {
    sister,
    sender,
    hero: {
      sceneryPath: "assets/summer-cove-hero.jpg",
      centralPhotoId: "photo-01",
      // Exactly four valid photo references for the overlapping hero Polaroids.
      polaroidPhotoIds: ["photo-05", "photo-03", "photo-01", "photo-09"],
    },
    film: {
      enabled: true,
      title: "The Doji Cut",
      sceneDuration: 4400,
      introDuration: 4200,
      outroDuration: 5600,
      photoIds: ["photo-08", "photo-07", "photo-06", "photo-04", "photo-03", "photo-02", "photo-05", "photo-09", "photo-01"],
    },
    video: {
      enabled: true,
      src: "assets/video/doji-fifteenth-birthday.mp4",
      poster: "assets/summer-cove-hero.jpg",
      downloadName: "Doji-15th-Birthday-Film.mp4",
      title: "The Summer She Turned Fifteen",
      durationLabel: "00:59",
      soundtrack: "deja vu · Olivia Rodrigo",
    },
    timeline,
    scrapbook,
    messages,
    letter,
    // EDIT HERE: enable only after adding both a real photo and an inside-joke caption.
    bonusScene: {
      enabled: false,
      photo: "",
      caption: "",
    },
  };
})();

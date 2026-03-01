(() => {
  const CATEGORIES = {
    'Herd Mentality': [
      'How many pillows are "too many" for a bed?',
      'How many slices of pizza is the "normal" amount to eat?',
      'If everyone in this room had to agree on one pizza topping, what would it be?',
      'If you had to describe the color "Blue" to a blind person, what word would you use?',
      'If you were a ghost, who would you haunt?',
      'Is a hot dog a sandwich? (Yes or No)',
      'Is cereal a soup?',
      'Name a "bad" habit.',
      'Name a "card game" that everyone knows how to play.',
      'Name a "dream job" for a 5-year-old.',
      'Name a "retro" piece of tech you miss.',
      'Name a "sport" that shouldn\'t actually be a sport.',
      'Name a "superpower" that would actually be a curse.',
      'Name a beverage you drink hot.',
      'Name a bird that cannot fly.',
      'Name a body part you have two of.',
      'Name a brand of luxury car.',
      'Name a brand of luxury watch.',
      'Name a cartoon character that is "annoying."',
      'Name a celebrity who seems "down to earth."',
      'Name a celebrity who would be a great President.',
      'Name a chore you always put off until the last minute.',
      'Name a common "office snack."',
      'Name a common "password" people use (but shouldn\'t).',
      'Name a common excuse for being late to work.',
      'Name a common farm animal.',
      'Name a common hobby for retired people.',
      'Name a condiment you keep in the fridge.',
      'Name a drink that is best served with lots of ice.',
      'Name a European capital city.',
      'Name a famous wizard.',
      'Name a fashion accessory that is actually quite useless.',
      'Name a finger on the human hand.',
      'Name a flower that smells amazing.',
      'Name a food that is better as a leftover.',
      'Name a food that is impossible to eat "gracefully."',
      'Name a fruit you have to peel before eating.',
      'Name a habit that is hard to break.',
      'Name a hairstyle that was popular but is now "cringe."',
      'Name a hobby that makes someone look "intellectual."',
      'Name a job that is harder than it looks.',
      'Name a job that requires wearing a uniform.',
      'Name a kitchen appliance you use almost every day.',
      'Name a language everyone should learn.',
      'Name a member of the Beatles.',
      'Name a month with 31 days.',
      'Name a movie that everyone has seen at least 5 times.',
      'Name a movie that made you cry.',
      'Name a musical instrument that is hard to play.',
      'Name a musical instrument you blow into.',
      'Name a mythical creature you wish was real.',
      'Name a personality trait that is "contagious."',
      'Name a piece of clothing you should never wear to a wedding.',
      'Name a planet (besides Earth).',
      'Name a plant that is easy to keep alive.',
      'Name a playground game you played as a kid.',
      'Name a prehistoric animal (besides a T-Rex).',
      'Name a primary color.',
      'Name a profession that earns a lot of respect.',
      'Name a reality TV show that is a "guilty pleasure."',
      'Name a reason someone might "ghost" a person.',
      'Name a reason to call in "sick" when you aren\'t.',
      'Name a shape with four sides.',
      'Name a smell that belongs in a kitchen.',
      'Name a social media app that is "dying."',
      'Name a social media platform that is for "older people."',
      'Name a song that everyone knows the lyrics to.',
      'Name a sound that is universally annoying.',
      'Name a sound that makes you sleepy.',
      'Name a sport played with a racket.',
      'Name a tech brand that people are "loyal" to.',
      'Name a toy that will never go out of style.',
      'Name a tree that is easy to identify.',
      'Name a TV show you can watch over and over.',
      'Name a type of hat that is hard to pull off.',
      'Name a type of nut found in a trail mix.',
      'Name a vegetable children usually hate.',
      'Name a vegetable that is better raw than cooked.',
      'Name a video game character everyone knows.',
      'Name a word that is hard to spell.',
      'Name a word that sounds funny.',
      'Name a word that starts with "Z".',
      'Name a yellow fruit.',
      'Name an animal that is surprisingly fast.',
      'Name an animal that lives in the ocean.',
      'Name an animal that would be terrifying if it were 100 cm tall.',
      'Name something people lie about on their resumes.',
      'Name something that is 10 cm long.',
      'Name something that is sticky.',
      'Name something you always forget to pack for vacation.',
      'Name something you can do in under 60 seconds.',
      'Name something you find in a junk drawer.',
      'Name something you keep in a "junk drawer."',
      'Should socks be worn with sandals? (Yes or No)',
      'What color are the most "boring" curtains?',
      'What color is a "stop" sign?',
      'What do you put in coffee: milk or sugar?',
      'What is a common pizza topping?',
      'What is the "best" color for a car?',
      'What is the "coolest" brand of sneakers?',
      'What is the "coolest" color?',
      'What is the "default" clothing item (e.g., Jeans, T-shirt)?',
      'What is the "king" of the biscuit/cookie world?',
      'What is the "loudest" animal?',
      'What is the "main character" zodiac sign?',
      'What is the "scariest" type of weather?',
      'What is the best "camping" food?',
      'What is the best "comfort movie"?',
      'What is the best "dip" for chips?',
      'What is the best "Emoji" to send when you\'re laughing?',
      'What is the best "Friday feeling" activity?',
      'What is the best "movie snack" that isn\'t popcorn?',
      'What is the best "secret" to have?',
      'What is the best "sitcom" of all time?',
      'What is the best "theme park" in the world?',
      'What is the best age to be?',
      'What is the best age to retire?',
      'What is the best board game of all time?',
      'What is the best color of game piece in Monopoly?',
      'What is the best color of ink for a pen?',
      'What is the best day to go grocery shopping?',
      'What is the best day to work from home?',
      'What is the best fast-food burger chain?',
      'What is the best flavor of ice cream?',
      'What is the best flavor of potato chip?',
      'What is the best flower to receive as a gift?',
      'What is the best invention of the last 100 years?',
      'What is the best outdoor activity for a first date?',
      'What is the best pattern for a dress shirt?',
      'What is the best prize to win in a competition?',
      'What is the best room to have a TV in?',
      'What is the best scent for a candle?',
      'What is the best season of the year?',
      'What is the best seat on a plane? (Window or Aisle)',
      'What is the best shape for pasta?',
      'What is the best streaming service?',
      'What is the best superpower?',
      'What is the best thing to put on a piece of toast?',
      'What is the best time for a lunch break?',
      'What is the best way to cook an egg?',
      'What is the best way to say "hello"?',
      'What is the best way to take notes: Pen and Paper or Laptop?',
      'What is the best way to travel: Plane, Train, or Car?',
      'What is the best way to wake up: Phone alarm or Radio?',
      'What is the cutest baby animal?',
      'What is the first day of the work week?',
      'What is the first thing people notice when they walk into a home?',
      'What is the first thing you do when you wake up?',
      'What is the most "attractive" musical instrument to play?',
      'What is the most "boring" job title?',
      'What is the most "epic" movie franchise?',
      'What is the most "main character" personality trait?',
      'What is the most "useful" website?',
      'What is the most "useless" animal?',
      'What is the most annoying "corporate" buzzword?',
      'What is the most annoying household chore?',
      'What is the most annoying sound a house makes?',
      'What is the most annoying thing about a smartphone?',
      'What is the most beautiful natural landmark in the world?',
      'What is the most common "coin toss" result: Heads or Tails?',
      'What is the most common "lucky number"?',
      'What is the most common fear?',
      'What is the most common first name?',
      'What is the most common lie people tell?',
      'What is the most common pet?',
      'What is the most controversial pizza topping (besides pineapple)?',
      'What is the most dangerous animal in the ocean?',
      'What is the most essential item in a winter wardrobe?',
      'What is the most essential item on a desk?',
      'What is the most famous city in the world?',
      'What is the most iconic Disney movie?',
      'What is the most important room in a house?',
      'What is the most popular holiday?',
      'What is the most popular soda brand?',
      'What is the most used app on your phone?',
      'What is the most versatile color for a t-shirt?',
      'What is the scariest insect?',
      'What is the ultimate "movie theater" candy?',
      'What is the worst day for a meeting?',
      'What time is "too early" to wake up?',
      'What was the "coolest" subject in school?',
      'Which animal is the "King of the Jungle"?',
      'Who is the best superhero?',
      'Who is the best villain in cinema history?',
      'Who is the most famous person named "Chris"?',
      'Who is the most iconic "bad guy" in a movie?',
      "Name a bug that isn't scary.",
      "Name a city you'd visit for a romantic getaway.",
      "Name a country you'd love to live in for a year.",
      "Name a famous historical figure you'd want to have dinner with.",
      "Name a fruit that doesn't belong in a fruit salad.",
      "Name a fruit that tastes better when it's cold.",
      "Name a genre of music you can't stand.",
      "Name a place where you'd find a lot of sand.",
      "Name a professional sport you'd never want to play.",
      "Name an animal that starts with the letter 'P'.",
      "Name an item you'd find in a hotel room.",
      "Name something you'd find on a teacher's desk.",
      "Name something you'd find under a sofa cushion.",
      "What is the first thing you'd buy if you won the lottery?",
    ],
  };

  function shuffle(array) {
    const r = [...array];
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  }

  function init() {
    const state = {};
    for (const [name, items] of Object.entries(CATEGORIES)) {
      state[name] = {
        deck: shuffle(items),
        index: 0,
      };
    }

    function getNextPrompt(categoryName) {
      const cat = state[categoryName];
      const item = cat.deck[cat.index];
      cat.index += 1;
      if (cat.index >= cat.deck.length) {
        cat.index = 0;
      }
      return item;
    }

    const container = document.getElementById('categoryBtns');
    const modal = new bootstrap.Modal(document.getElementById('promptModal'));
    const promptText = document.getElementById('promptText');
    const promptNextBtn = document.getElementById('promptNextBtn');
    let currentCategory = null;

    for (const name of Object.keys(CATEGORIES)) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-primary btn-lg p-3 fs-4';
      btn.textContent = name;
      btn.addEventListener('click', () => {
        currentCategory = name;
        promptText.textContent = getNextPrompt(name);
        modal.show();
      });
      container.appendChild(btn);
    }

    promptNextBtn.addEventListener('click', () => {
      if (currentCategory) {
        promptText.textContent = getNextPrompt(currentCategory);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

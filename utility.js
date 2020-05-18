/* Utility functions for backend */ 
const crypto = require('crypto');

function randomName() {
  let rawAdjectives = "Defiant,HomelessAdorable,Delightful,Homely,Quaint,Adventurous,Depressed,Horrible,Aggressive,Determined,Hungry,Real,Agreeable,Different,Hurt,Relieved,Alert,Difficult,Repulsive,Alive,Disgusted,Ill,Rich,Amused,Distinct,Important,Angry,Disturbed,Impossible,Scary,Annoyed,Dizzy,Inexpensive,Selfish,Annoying,Doubtful,Innocent,Shiny,Anxious,Drab,Inquisitive,Shy,Arrogant,Dull,Itchy,Silly,Ashamed,Sleepy,Attractive,Eager,Jealous,Smiling,Average,Easy,Jittery,Smoggy,Awful,Elated,Jolly,Sore,Elegant,Joyous,Sparkling,Bad,Embarrassed,Splendid,Beautiful,Enchanting,Kind,Spotless,Better,Encouraging,Stormy,Bewildered,Energetic,Lazy,Strange,Pink,Enthusiastic,Light,Stupid,Bloody,Envious,Lively,Successful,Blue,Evil,Lonely,Super,Blue,Excited,Long,Blushing,Expensive,Lovely,Talented,Bored,Exuberant,Lucky,Tame,Brainy,Tender,Brave,Fair,Magnificent,Tense,Breakable,Faithful,Misty,Terrible,Bright,Famous,Modern,Tasty,Busy,Fancy,Motionless,Thankful,Fantastic,Muddy,Thoughtful,Calm,Fierce,Mushy,Thoughtless,Careful,Filthy,Mysterious,Tired,Cautious,Fine,Tough,Charming,Foolish,Nasty,Troubled,Cheerful,Fragile,Naughty,Clean,Frail,Nervous,Ugliest,Clear,Frantic,Nice,Ugly,Clever,Friendly,Nutty,Uninterested,Cloudy,Frightened,Unsightly,Clumsy,Funny,Obedient,Unusual,Colorful,Obnoxious,Upset,Combative,Gentle,Odd,Uptight,Comfortable,Gifted,Old,Concerned,Glamorous,Open,Vast,Condemned,Gleaming,Outrageous,Victorious,Confused,Glorious,Outstanding,Vivacious,Cooperative,Good,Courageous,Gorgeous,Panicky,Wandering,Crazy,Graceful,Perfect,Weary,Creepy,Grieving,Plain,Wicked,Crowded,Grotesque,Pleasant,Wide,Cruel,Grumpy,Poised,Wild,Curious,Poor,Witty,Cute,Handsome,Powerful,Worrisome,Happy,Precious,Worried,Dangerous,Healthy,Prickly,Wrong,Dark,Helpful,Proud,Dead,Helpless,Putrid,Zany,Defeated,Hilarious,Puzzled,Zealous";

  let rawNouns = "Actor,Gold,Painting,Advertisement,Grass,Parrot,Afternoon,Greece,Pencil,Airport,Guitar,Piano,Ambulance,Hair,Pillow,Animal,Hamburger,Pizza,Answer,Helicopter,Planet,Apple,Helmet,Plastic,Army,Holiday,Portugal,Australia,Honey,Potato,Balloon,Horse,Queen,Banana,Hospital,Quill,Battery,House,Rain,Beach,Hydrogen,Rainbow,Beard,Ice,Raincoat,Bed,Insect,Refrigerator,Belgium,Insurance,Restaurant,Boy,Iron,River,Branch,Island,Rocket,Breakfast,Jackal,Room,Brother,Jelly,Rose,Camera,Jewellery,Russia,Candle,Jordan,Sandwich,Car,Katie,Banana,Puppy,Elephant,Juice,School,Caravan,Kangaroo,Scooter,Carpet,King,Shampoo,Cartoon,Kitchen,Shoe,China,Kite,Soccer,Church,Knife,Spoon,Crayon,Lamp,Stone,Crowd,Lawyer,Sugar,Daughter,Leather,Sweden,Death,Library,Teacher,Denmark";
    
  let adjectives = rawAdjectives.split(",");
  let nouns = rawNouns.split(","); 
    
  let adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  let noun = nouns[Math.floor(Math.random() * nouns.length)];
    
  return adjective + noun; 
}


function hashPassword(pass, salt) {
  let hash = crypto.createHmac('sha512', salt);
  hash.update(pass);
  let value = hash.digest('hex');
  return value;
}

function generateSalt() {
  return crypto.randomBytes(128).toString('base64');
}

module.exports = {
  randomName,
  hashPassword,
  generateSalt
}
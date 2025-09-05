export const data = {
  Light: ["9S (starr)", "Aether", "Angel Devil", "Devine Kitsune", "Gilbert Bougainvillea", "Levi Ackerman", "Lumine (starr)", "Pacis Maria", "Sakura Matou", "Senku Ishigami", "Tomaki Ichia", "Yamada Asaemon Sagiri", "Yoriichi Tsugikuni"].map(name => ({ name })),
  Dark: ["2B (starr)", "Chainsaw Man", "Dante", "Feitan Portor", "Fischl", "Fumikage Tokoyami", "Hu Tao", "Ken Kaneki", "Kokushibo", "Muzan Kibutsuji", "Nezuko Kamado", "Power", "Ryuk (starr)", "Sable Mary", "Souya Kawata", "Tenebris (starr)", "Tobio Kageyama", "Vergil", "Violence Devil", "Yor Forger (starr)", "Zombieman"].map(name => ({ name })),
  Balance: ["Elara Valestra", "Gin", "Hotaru Takegawa", "Koshi Sugawara", "Makima"].map(name => ({ name })),
  Grass: ["Izuna Tokage", "Nahida", "Neji Hyuuga", "Obanai Iguro", "Roronoa Zoro", "Shinobu Kocho", "Sinon", "Sylvia Sherwood", "Verdant Sentinel", "Violet Evergarden (starr)", "Yoichi Isagi"].map(name => ({ name })),
  Fire: [
    { name: "Ai Enma" },
    { name: "Blaze Howl" },
    { name: "Eris Boreas Greyrat", image: "https://cdn.discordapp.com/attachments/1069706839295528989/1413017196627755109/image.png?ex=68ba6650&is=68b914d0&hm=2697efa247d92eebbfe3b825bca4e5edee28978c8556cff44286592a178839ea", details: "Eris is a fiery and impulsive swordswoman from the world of Mushoku Tensei. Her aggressive fighting style makes her a top-tier choice for raid events that require high burst damage. She excels in frontline combat." },
    { name: "Juuzou Suzuya" },
    { name: "Kaizen Arashi" },
    { name: "Mavuika" },
    { name: "Mika Sei (starr)" },
    { name: "Orihime Inoue" },
    { name: "Ruby Hoshino" },
    { name: "Suzaku Kururugi" },
    { name: "Vinsmoke Sanji" },
    { name: "Xue Lian" }
  ],
  Water: ["Aqua Hoshino", "Asuna", "Higashiyama Kobeni", "Kallen Kozuki", "Neuvillette", "Shoto Todoroki", "Sophia Belle", "Thomas Andre", "Trunks"].map(name => ({ name })),
  Electric: ["Dio Brando", "Emai Joma (starr)", "Izuku Midoriya", "Killua Zoldyck", "Raiden Shogun (starr)", "Yuu Nishinoya"].map(name => ({ name })),
  Ground: ["Aventurine", "Aza Chobei", "Cu Chulian", "Damian Desmond", "Gilda", "Inosuke Hashibira", "Mitsuya Takashi", "Muichiro Tokito", "Shion", "Zhongli"].map(name => ({ name })),
};

export const ELEMENTS = Object.keys(data);

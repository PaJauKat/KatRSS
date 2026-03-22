import { XMLParser } from "fast-xml-parser";
import { zstdDecompress } from "node:zlib";


type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};


export async function fetchFeed(feedURL: string): Promise<RSSFeed>{
    
    const response = await fetch(feedURL, {
        headers: {
        "User-Agent": "gator",
        },
    });

    if (!response.ok) {
        throw new Error(`Error al obtener el feed: ${response.statusText}`);
    }

    const xmlData = await response.text();

    // 2. Parse the XML
    const parser = new XMLParser();
    const jsonObj = parser.parse(xmlData);

    // 3. Extract the channel field
    // Los RSS suelen estar envueltos en una etiqueta <rss>
    const channel = jsonObj.rss?.channel || jsonObj.channel;

    if (!channel) {
        throw new Error("El formato del feed es inválido: falta el campo 'channel'.");
    }

    const { title, link, description } = channel;

    if (!title || !link || !description) {
        throw new Error("Faltan metadatos obligatorios en el canal.");
    }

    let items: RSSItem[] = [];
    if (channel.item){
        const rawItems = Array.isArray(channel.item) ? channel.item : [channel.item];

        items = rawItems.map((item: any) => ({
            title: item.title,
            link: item.link,
            description: item.description,
            pubDate: item.pubDate,
        })).filter((item: RSSItem) => 
            item.title && item.link && item.description && item.pubDate
        );
    }

    let meow: RSSFeed = {
        channel: {
            title,
            link,
            description,
            item: items
        }
    }

    return meow;
}
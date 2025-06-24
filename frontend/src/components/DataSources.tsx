import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DataSource {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
}

const DataSources = () => {
  const sources: DataSource[] = [
    {
      id: 'bbc',
      name: 'BBC News',
      type: 'RSS',
      url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
      enabled: true
    },
    {
      id: 'reuters',
      name: 'Reuters',
      type: 'RSS',
      url: 'https://feeds.reuters.com/reuters/worldNews',
      enabled: true
    },
    {
      id: 'ap',
      name: 'Associated Press',
      type: 'RSS',
      url: 'https://feeds.apnews.com/rss/apf-topnews',
      enabled: true
    },
    {
      id: 'cnn',
      name: 'CNN World News',
      type: 'RSS',
      url: 'http://rss.cnn.com/rss/edition.rss',
      enabled: true
    },
    {
      id: 'aljazeera',
      name: 'Al Jazeera Arabic',
      type: 'RSS',
      url: 'https://www.aljazeera.net/xml/rss/all.xml',
      enabled: true
    },
    {
      id: 'timesofisrael',
      name: 'Times of Israel',
      type: 'RSS',
      url: 'https://www.timesofisrael.com/rss',
      enabled: true
    },
    {
      id: 'kyivindependent',
      name: 'Kyiv Independent',
      type: 'RSS',
      url: 'https://kyivindependent.com/feed',
      enabled: true
    },
    {
      id: 'defense',
      name: 'US Department of Defense',
      type: 'Government',
      url: 'https://www.defense.gov/Portals/1/Documents/pubs/2023-Defense-Strategic-Guidance.pdf',
      enabled: true
    },
    {
      id: 'nato',
      name: 'NATO Official News',
      type: 'Government',
      url: 'https://www.nato.int/cps/en/natolive/news.htm',
      enabled: true
    },
    {
      id: 'ukraine',
      name: 'Ukraine Ministry of Defense',
      type: 'Government',
      url: 'https://www.mil.gov.ua/en/feed/',
      enabled: true
    },
    {
      id: 'idf',
      name: 'Israel Defense Forces',
      type: 'Government',
      url: 'https://www.idf.il/en/rss/',
      enabled: true
    },
    {
      id: 'state',
      name: 'US State Department',
      type: 'Government',
      url: 'https://www.state.gov/rss-feeds/',
      enabled: true
    },
    {
      id: 'intelcrab',
      name: 'OSINT Twitter (@IntelCrab)',
      type: 'Social Media',
      url: 'https://twitter.com/IntelCrab',
      enabled: true
    },
    {
      id: 'conflicts',
      name: 'OSINT Twitter (@Conflicts)',
      type: 'Social Media',
      url: 'https://twitter.com/Conflicts',
      enabled: true
    },
    {
      id: 'uaweapons',
      name: 'OSINT Twitter (@UAWeapons)',
      type: 'Social Media',
      url: 'https://twitter.com/UAWeapons',
      enabled: true
    },
    {
      id: 'geoconfirmed',
      name: 'OSINT Twitter (@GeoConfirmed)',
      type: 'Social Media',
      url: 'https://twitter.com/GeoConfirmed',
      enabled: true
    },
    {
      id: 'rybar_en',
      name: 'Intelligence Telegram (rybar_en)',
      type: 'Telegram',
      url: 'https://t.me/rybar_en',
      enabled: true
    },
    {
      id: 'warmonitor',
      name: 'Intelligence Telegram (warmonitor)',
      type: 'Telegram',
      url: 'https://t.me/warmonitor',
      enabled: true
    },
    {
      id: 'intelslava',
      name: 'Intelligence Telegram (IntelSlava)',
      type: 'Telegram',
      url: 'https://t.me/IntelSlava',
      enabled: true
    },
    {
      id: 'defence_blog',
      name: 'Intelligence Telegram (defence_blog)',
      type: 'Telegram',
      url: 'https://t.me/defence_blog',
      enabled: true
    },
    {
      id: 'rt',
      name: 'RT Russian',
      type: 'Multi-language',
      url: 'https://russian.rt.com/rss',
      enabled: true
    },
    {
      id: 'alarabiya',
      name: 'Al Arabiya Arabic',
      type: 'Multi-language',
      url: 'https://www.alarabiya.net/.mrss/en',
      enabled: true
    },
    {
      id: 'tass',
      name: 'TASS Russian',
      type: 'Multi-language',
      url: 'https://tass.com/rss/v2.xml',
      enabled: true
    },
    {
      id: 'interfax',
      name: 'Interfax Russia',
      type: 'Multi-language',
      url: 'https://www.interfax.ru/rss',
      enabled: true
    },
        {
          id: 'ahram',
          name: 'Al Ahram Arabic',
          type: 'Multi-language',
          url: 'http://www.ahram.org.eg/NewsFeed/ENFeed/0',
          enabled: true
        }
      ];
    
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
              <CardDescription>
                Manage your intelligence data sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sources.map((source) => (
                  <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{source.name}</h3>
                      <p className="text-sm text-gray-500">{source.type} - {source.url}</p>
                    </div>
                    <Button variant={source.enabled ? "default" : "outline"}>
                      {source.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    };
    
    export default DataSources;

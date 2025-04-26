import csv
from itertools import batched
from xml.etree import ElementTree

import requests


FILENAME = 'played.csv'
FIELDS = ['id', 'name', 'year', 'rating', 'rank', 'weight']


def fetch_game_data(thing_ids):
    result = {}
    for batch in batched(thing_ids, 20):
        url = f'https://boardgamegeek.com/xmlapi2/thing?stats=1&id={",".join(batch)}'
        res = requests.get(url, headers={'Accept': 'text/html,application/xhtml+xml,application/xml'})
        res.raise_for_status()

        root = ElementTree.fromstring(res.text)
        for item in root.iter('item'):
            item_id = item.get('id')
            data = {
                'name': item.find('./name[@type="primary"]').get('value'),
                'year': max(0, int(item.find('./yearpublished').get('value'))),
                'rating': float(item.find('.//ratings/average').get('value')),
                'rank': item.find('.//ratings/ranks/rank[@name="boardgame"]').get('value'),
                'weight': float(item.find('.//ratings/averageweight').get('value')),
            }
            data['rank'] = int(data['rank']) if str(data['rank']).isdigit() else None
            result[item_id] = data
    return result


def main():
    with open(FILENAME, 'r+', encoding='utf-8') as f:
        game_map = {game['id']: game for game in csv.DictReader(f.readlines(), fieldnames=FIELDS)}
        games = list(game_map.values())
        thing_ids = list(game_map.keys())

        # Fetch, update, and sort games
        game_data = fetch_game_data(thing_ids)
        for game in games:
            game.update(game_data.get(game['id'], {}))
        games.sort(key=lambda game: game['name'].casefold())

        # Write updated games
        f.seek(0)
        writer = csv.DictWriter(f, fieldnames=FIELDS, lineterminator='\n')
        writer.writerows(games)
        f.truncate()


if __name__ == '__main__':
    main()

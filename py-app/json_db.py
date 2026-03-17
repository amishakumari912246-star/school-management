import json
import os
import uuid
from datetime import datetime


class JsonDb:
    def __init__(self, data_dir):
        self.data_dir = data_dir
        os.makedirs(data_dir, exist_ok=True)

    def _path(self, collection):
        return os.path.join(self.data_dir, f'{collection}.json')

    def read(self, collection):
        path = self._path(collection)
        if not os.path.exists(path):
            self._write(collection, [])
            return []
        try:
            with open(path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []

    def _write(self, collection, data):
        with open(self._path(collection), 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def find_all(self, collection):
        return list(reversed(self.read(collection)))

    def find_by_id(self, collection, record_id):
        return next((r for r in self.read(collection) if r.get('_id') == record_id), None)

    def create(self, collection, payload):
        rows = self.read(collection)
        row = {'_id': str(uuid.uuid4()), **payload, 'createdAt': datetime.now().isoformat()}
        rows.append(row)
        self._write(collection, rows)
        return row

    def update_by_id(self, collection, record_id, payload):
        rows = self.read(collection)
        for i, r in enumerate(rows):
            if r.get('_id') == record_id:
                rows[i] = {**r, **payload, '_id': record_id, 'updatedAt': datetime.now().isoformat()}
                self._write(collection, rows)
                return rows[i]
        return None

    def delete_by_id(self, collection, record_id):
        rows = self.read(collection)
        new_rows = [r for r in rows if r.get('_id') != record_id]
        if len(new_rows) == len(rows):
            return False
        self._write(collection, new_rows)
        return True

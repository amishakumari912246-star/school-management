import os
import socket
from datetime import datetime, timedelta, timezone
from functools import wraps

import bcrypt
import jwt
from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory

from json_db import JsonDb

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'static'), static_url_path='')
db = JsonDb(os.path.join(BASE_DIR, 'data'))
JWT_SECRET = os.getenv('JWT_SECRET', 'school_secret_2026')


# ── Auth helpers ─────────────────────────────────────────────────────────────

def get_payload():
    h = request.headers.get('Authorization', '')
    if not h.startswith('Bearer '):
        return None
    try:
        return jwt.decode(h[7:], JWT_SECRET, algorithms=['HS256'])
    except Exception:
        return None


def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not get_payload():
            return jsonify({'message': 'Unauthorized'}), 401
        return f(*args, **kwargs)
    return wrapper


# ── Static files ─────────────────────────────────────────────────────────────

@app.route('/')
def index():
    return app.send_static_file('index.html')


# ── Health ───────────────────────────────────────────────────────────────────

@app.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'time': datetime.now(timezone.utc).isoformat()})


@app.route('/api/network-info')
def network_info():
    ip = '127.0.0.1'
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass
    port = int(os.getenv('PORT', 5000))
    return jsonify({'ip': ip, 'port': port, 'mobileUrl': f'http://{ip}:{port}/'})

# ── Auth routes ──────────────────────────────────────────────────────────────

@app.route('/api/auth/login', methods=['POST'])
def login():
    d = request.get_json() or {}
    email = str(d.get('email', '')).lower().strip()
    password = str(d.get('password', ''))
    role = str(d.get('role', ''))

    if not (email and password and role):
        return jsonify({'message': 'Email, password and role are required'}), 400

    user = next((u for u in db.read('users') if u['email'] == email and u['role'] == role), None)
    if not user or not bcrypt.checkpw(password.encode(), user['passwordHash'].encode()):
        return jsonify({'message': 'Invalid credentials'}), 401

    token = jwt.encode(
        {'id': user['_id'], 'email': user['email'], 'role': user['role'], 'name': user['name'],
         'exp': datetime.now(timezone.utc) + timedelta(hours=12)},
        JWT_SECRET, algorithm='HS256'
    )
    return jsonify({
        'token': token,
        'user': {'id': user['_id'], 'name': user['name'], 'email': user['email'], 'role': user['role']}
    })


@app.route('/api/auth/register', methods=['POST'])
def register():
    d = request.get_json() or {}
    name = d.get('name', '').strip()
    email = str(d.get('email', '')).lower().strip()
    password = d.get('password', '')
    role = d.get('role', '')

    if not all([name, email, password, role]):
        return jsonify({'message': 'All fields required'}), 400
    if any(u['email'] == email and u['role'] == role for u in db.read('users')):
        return jsonify({'message': 'User already exists for this role'}), 409

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    u = db.create('users', {'name': name, 'email': email, 'passwordHash': password_hash, 'role': role})
    return jsonify({'id': u['_id'], 'name': u['name'], 'email': u['email'], 'role': u['role']}), 201


# ── Dashboard ────────────────────────────────────────────────────────────────

@app.route('/api/dashboard/summary')
@auth_required
def dashboard_summary():
    fees = db.read('fees')
    return jsonify({
        'totalStudents': len(db.read('students')),
        'totalTeachers': len(db.read('teachers')),
        'totalClasses': len(db.read('classes')),
        'attendancePercent': 92,
        'pendingFees': sum(float(f.get('pendingAmount') or 0) for f in fees)
    })


# ── Generic CRUD factory ─────────────────────────────────────────────────────

def register_crud(collection):
    prefix = f'/api/{collection}'

    @app.route(prefix, methods=['GET'], endpoint=f'{collection}_list')
    @auth_required
    def _list():
        return jsonify(db.find_all(collection))

    @app.route(prefix, methods=['POST'], endpoint=f'{collection}_create')
    @auth_required
    def _create():
        return jsonify(db.create(collection, request.get_json() or {})), 201

    @app.route(f'{prefix}/<rid>', methods=['GET'], endpoint=f'{collection}_get')
    @auth_required
    def _get(rid):
        items = db.find_all(collection)
        item = next((i for i in items if i.get('_id') == rid), None)
        return (jsonify(item), 200) if item else (jsonify({'message': 'Not found'}), 404)

    @app.route(f'{prefix}/<rid>', methods=['PUT'], endpoint=f'{collection}_update')
    @auth_required
    def _update(rid):
        updated = db.update_by_id(collection, rid, request.get_json() or {})
        return (jsonify(updated), 200) if updated else (jsonify({'message': 'Not found'}), 404)

    @app.route(f'{prefix}/<rid>', methods=['DELETE'], endpoint=f'{collection}_delete')
    @auth_required
    def _delete(rid):
        ok = db.delete_by_id(collection, rid)
        return (jsonify({'message': 'Deleted'}), 200) if ok else (jsonify({'message': 'Not found'}), 404)


for col in ['students', 'teachers', 'attendance', 'fees', 'exams', 'admitcards', 'classes', 'library']:
    register_crud(col)


# ── Results (auto-calculates percentage) ─────────────────────────────────────

@app.route('/api/results', methods=['GET'])
@auth_required
def results_list():
    return jsonify(db.find_all('results'))


@app.route('/api/results', methods=['POST'])
@auth_required
def results_create():
    d = request.get_json() or {}
    total = float(d.get('totalMarks') or 0)
    obtained = float(d.get('marksObtained') or 0)
    pct = round(obtained / total * 100, 2) if total else 0
    d['percentage'] = pct
    d['resultStatus'] = 'Pass' if pct >= 33 else 'Fail'
    return jsonify(db.create('results', d)), 201


@app.route('/api/results/<rid>', methods=['PUT'])
@auth_required
def results_update(rid):
    d = request.get_json() or {}
    total = float(d.get('totalMarks') or 0)
    obtained = float(d.get('marksObtained') or 0)
    pct = round(obtained / total * 100, 2) if total else 0
    d['percentage'] = pct
    d['resultStatus'] = 'Pass' if pct >= 33 else 'Fail'
    updated = db.update_by_id('results', rid, d)
    return (jsonify(updated), 200) if updated else (jsonify({'message': 'Not found'}), 404)


@app.route('/api/results/<rid>', methods=['DELETE'])
@auth_required
def results_delete(rid):
    ok = db.delete_by_id('results', rid)
    return (jsonify({'message': 'Deleted'}), 200) if ok else (jsonify({'message': 'Not found'}), 404)


# ── Seed & start ──────────────────────────────────────────────────────────────

def seed_admin():
    users = db.read('users')
    if not any(u['email'] == 'admin@school.com' and u['role'] == 'Admin' for u in users):
        ph = bcrypt.hashpw(b'Admin@123', bcrypt.gensalt()).decode()
        db.create('users', {
            'name': 'System Admin',
            'email': 'admin@school.com',
            'passwordHash': ph,
            'role': 'Admin'
        })
        print('Default admin created: admin@school.com / Admin@123')


def seed_classes():
    classes = db.read('classes')
    if len(classes) == 0:
        default_classes = [
            {'className': 'Nursery', 'section': 'A', 'classTeacher': '', 'roomNumber': '101', 'capacity': '30', 'subjects': 'English, Hindi, Drawing, Rhymes'},
            {'className': 'Nursery', 'section': 'B', 'classTeacher': '', 'roomNumber': '102', 'capacity': '30', 'subjects': 'English, Hindi, Drawing, Rhymes'},
            {'className': 'LKG', 'section': 'A', 'classTeacher': '', 'roomNumber': '103', 'capacity': '30', 'subjects': 'English, Hindi, Maths, Drawing, Rhymes'},
            {'className': 'LKG', 'section': 'B', 'classTeacher': '', 'roomNumber': '104', 'capacity': '30', 'subjects': 'English, Hindi, Maths, Drawing, Rhymes'},
            {'className': 'UKG', 'section': 'A', 'classTeacher': '', 'roomNumber': '105', 'capacity': '30', 'subjects': 'English, Hindi, Maths, Drawing, EVS'},
            {'className': 'UKG', 'section': 'B', 'classTeacher': '', 'roomNumber': '106', 'capacity': '30', 'subjects': 'English, Hindi, Maths, Drawing, EVS'},
            {'className': '1', 'section': 'A', 'classTeacher': '', 'roomNumber': '201', 'capacity': '40', 'subjects': 'English, Hindi, Maths, EVS, Drawing'},
            {'className': '1', 'section': 'B', 'classTeacher': '', 'roomNumber': '202', 'capacity': '40', 'subjects': 'English, Hindi, Maths, EVS, Drawing'},
            {'className': '2', 'section': 'A', 'classTeacher': '', 'roomNumber': '203', 'capacity': '40', 'subjects': 'English, Hindi, Maths, EVS, Drawing'},
            {'className': '2', 'section': 'B', 'classTeacher': '', 'roomNumber': '204', 'capacity': '40', 'subjects': 'English, Hindi, Maths, EVS, Drawing'},
            {'className': '3', 'section': 'A', 'classTeacher': '', 'roomNumber': '205', 'capacity': '40', 'subjects': 'English, Hindi, Maths, Science, SST'},
            {'className': '3', 'section': 'B', 'classTeacher': '', 'roomNumber': '206', 'capacity': '40', 'subjects': 'English, Hindi, Maths, Science, SST'},
            {'className': '4', 'section': 'A', 'classTeacher': '', 'roomNumber': '207', 'capacity': '40', 'subjects': 'English, Hindi, Maths, Science, SST'},
            {'className': '4', 'section': 'B', 'classTeacher': '', 'roomNumber': '208', 'capacity': '40', 'subjects': 'English, Hindi, Maths, Science, SST'},
            {'className': '5', 'section': 'A', 'classTeacher': '', 'roomNumber': '209', 'capacity': '40', 'subjects': 'English, Hindi, Maths, Science, SST'},
            {'className': '5', 'section': 'B', 'classTeacher': '', 'roomNumber': '210', 'capacity': '40', 'subjects': 'English, Hindi, Maths, Science, SST'},
            {'className': '6', 'section': 'A', 'classTeacher': '', 'roomNumber': '301', 'capacity': '45', 'subjects': 'English, Hindi, Maths, Science, SST, Sanskrit'},
            {'className': '6', 'section': 'B', 'classTeacher': '', 'roomNumber': '302', 'capacity': '45', 'subjects': 'English, Hindi, Maths, Science, SST, Sanskrit'},
            {'className': '7', 'section': 'A', 'classTeacher': '', 'roomNumber': '303', 'capacity': '45', 'subjects': 'English, Hindi, Maths, Science, SST, Sanskrit'},
            {'className': '7', 'section': 'B', 'classTeacher': '', 'roomNumber': '304', 'capacity': '45', 'subjects': 'English, Hindi, Maths, Science, SST, Sanskrit'},
            {'className': '8', 'section': 'A', 'classTeacher': '', 'roomNumber': '305', 'capacity': '45', 'subjects': 'English, Hindi, Maths, Science, SST, Sanskrit'},
            {'className': '8', 'section': 'B', 'classTeacher': '', 'roomNumber': '306', 'capacity': '45', 'subjects': 'English, Hindi, Maths, Science, SST, Sanskrit'},
            {'className': '9', 'section': 'A', 'classTeacher': '', 'roomNumber': '401', 'capacity': '45', 'subjects': 'English, Hindi, Maths, Science, SST'},
            {'className': '9', 'section': 'B', 'classTeacher': '', 'roomNumber': '402', 'capacity': '45', 'subjects': 'English, Hindi, Maths, Science, SST'},
            {'className': '10', 'section': 'A', 'classTeacher': '', 'roomNumber': '403', 'capacity': '45', 'subjects': 'English, Hindi, Maths, Science, SST'},
            {'className': '10', 'section': 'B', 'classTeacher': '', 'roomNumber': '404', 'capacity': '45', 'subjects': 'English, Hindi, Maths, Science, SST'},
            {'className': '11 (Science)', 'section': 'A', 'classTeacher': '', 'roomNumber': '501', 'capacity': '40', 'subjects': 'English, Physics, Chemistry, Maths, Biology/CS'},
            {'className': '11 (Commerce)', 'section': 'A', 'classTeacher': '', 'roomNumber': '502', 'capacity': '40', 'subjects': 'English, Accountancy, Business Studies, Economics, Maths'},
            {'className': '12 (Science)', 'section': 'A', 'classTeacher': '', 'roomNumber': '503', 'capacity': '40', 'subjects': 'English, Physics, Chemistry, Maths, Biology/CS'},
            {'className': '12 (Commerce)', 'section': 'A', 'classTeacher': '', 'roomNumber': '504', 'capacity': '40', 'subjects': 'English, Accountancy, Business Studies, Economics, Maths'},
        ]
        for cls in default_classes:
            db.create('classes', cls)
        print(f'Default classes created: Nursery to 12th ({len(default_classes)} classes)')


seed_admin()
seed_classes()


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f'School app running at http://localhost:{port}')
    debug_mode = os.getenv('FLASK_DEBUG', '1') == '1'
    app.run(host='0.0.0.0', port=port, debug=debug_mode, use_reloader=debug_mode)

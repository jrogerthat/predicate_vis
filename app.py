from copyreg import pickle
from flask import Flask, render_template, request
import os
import json
import pandas as pd
import numpy as np
import pickle
import altair as alt
from predicate_display import PredicateDisplay, PredicateEntry
from control import Control

from predicate_induction_main import Predicate

app = Flask(__name__)
app.secret_key = ''
app.config['SESSION_TYPE'] = 'filesystem'
path = os.path.dirname(os.path.realpath(__file__))
colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#17becf", "#bcbd22"]
data_path = 'static/data/superstore_data.csv'
dtypes_path = 'static/data/superstore_dtypes.json'
target = 'iforest_score'
features = ['Order Date', 'Ship Date', 'Ship Mode', 'Segment', 'State', 'Sub-Category', 'Discount']
num_bins = 100

session_id = "49324312"
predicates_path = f'static/data/predicates_{session_id}.pkl'
predicate_id_path = f'static/data/predicate_id_{session_id}.json'

@app.route("/")
def index():
    save_predicates({'default': {}, 'hidden': {}, 'archived': {}}, predicates_path)
    save_predicate_id(0, predicate_id_path)
    return render_template("index.html", features=features)

def load_data(data_path):
    data = pd.read_csv(f'{path}/{data_path}')
    return data

def load_dtypes(dtypes_path):
    with open(f"{path}/{dtypes_path}", 'r') as f:
        dtypes = json.load(f)
    return dtypes

def load_predicates(predicates_path):
    with open(f"{path}/{predicates_path}", 'rb') as f:
        predicates = pickle.load(f)
    return predicates

def save_predicates(predicates, predicates_path):
    with open(f"{path}/{predicates_path}", 'wb') as f:
        pickle.dump(predicates, f)
    return predicates

def load_predicate_id(predicate_id_path):
    with open(f"{path}/{predicate_id_path}", 'r') as f:
        predicate_id = json.load(f)['predicate_id']
    return predicate_id

def save_predicate_id(predicate_id, predicate_id_path):
    with open(f"{path}/{predicate_id_path}", 'w') as f:
        json.dump({'predicate_id': predicate_id}, f)

def plot_predicates(predicates, target, num_bins=25):
    data = load_data(data_path)
    hist = pd.concat([predicates[i].get_distribution(data[target], num_bins).assign(predicate_id=i) for i in predicates.keys()])
    range_ = [colors[i] for i in predicates.keys()]
    spec = json.loads(alt.Chart(hist).mark_bar().encode(
        x='bin',
        y='density',
        color=alt.Color('predicate_id', scale=alt.Scale(domain=list(predicates.keys()), range=range_), legend=None)
    ).configure_mark(
        opacity=0.5,
    ).configure_scale(bandPaddingInner=0).to_json())
    spec['width'] = 'container'
    spec['height'] = 'container'
    return spec

def plot_predicate(predicate, x_feature, target_features):
    filter = predicate.feature_mask[[col for col in predicate.feature_mask.columns if col != x_feature]].all(axis=1)
    data = load_data(data_path)
    dtypes = load_dtypes(dtypes_path)
    d = pd.melt(data.loc[filter], x_feature, target_features)
    print(d)
    if dtypes[x_feature] == 'nominal':
        x_encoding = f'{x_feature}:O'
    else:
        x_encoding = alt.X(f"{x_feature}:Q", bin=True)
    spec = json.loads(alt.Chart(d).mark_bar().encode(
        x=x_encoding,
        y=f'mean(value):Q',
        color=f'variable:N',
    ).to_json())
    spec['width'] = 'container'
    spec['height'] = 'container'
    return spec

def parse_feature_values(feature, values, dtypes):
    if dtypes[feature] == 'numeric':
        values = [float(values[0]), float(values[1])]
    elif dtypes[feature] == 'ordinal':
        values = [int(values[0]), int(values[1])]
    elif dtypes[feature] == 'date':
        values = [pd.to_datetime(values[0]), pd.to_datetime(values[1])]
    return values

def get_feature_domain(feature, data, dtype):
    if dtype == 'nominal':
        return data[feature].unique().tolist()
    else:
        return [data[feature].min(), data[feature].max()]

def get_feature_domains(features, data, dtypes):
    return {f: get_feature_domain(f, data, dtypes[f]) for f in features}

def update_predicates(predicates, new_predicates, hidden_predicates, archived_predicates, data, dtypes, predicate_id, other_predicates=None):
    for i in range(len(new_predicates)):
        new_predicates[i].fit(data)
        predicates[i+predicate_id] = new_predicates[i]
    all_predicates = {'default': predicates, 'hidden': hidden_predicates, 'archived': archived_predicates}
    if other_predicates is not None:
        for k,v in other_predicates.items():
            all_predicates[k] = v
    save_predicate_id(predicate_id + len(new_predicates), predicate_id_path)
    save_predicates(all_predicates, predicates_path)
    spec = plot_predicates(predicates, target, num_bins)

    new_display = {i+predicate_id: PredicateDisplay(i+predicate_id, colors[i+predicate_id], new_predicates[i].feature_values, dtypes).display() for i in range(len(new_predicates))}
    feature_values = {i+predicate_id: new_predicates[i].feature_values for i in range(len(new_predicates))}
    feature_domains = {k: get_feature_domains(v.keys(), data, dtypes) for k,v in feature_values.items()}
    return {'plot': spec, 'display': new_display, 'feature_values': feature_values, 'feature_domains': feature_domains, 'dtypes': dtypes}

def add_predicates(feature_values, all_predicates=None):
    if all_predicates is None:
        all_predicates = load_predicates(predicates_path)
    keys = list(all_predicates.keys())
    hidden_predicates = all_predicates['hidden']
    archived_predicates = all_predicates['archived']
    predicates = all_predicates['default']
    data = load_data(data_path)
    dtypes = load_dtypes(dtypes_path)
    predicate_id = load_predicate_id(predicate_id_path)

    parsed_feature_values = [{feature: parse_feature_values(feature, values, dtypes) for feature, values in f.items()} for f in feature_values]
    new_predicates = [Predicate(f, dtypes) for f in parsed_feature_values]
    return update_predicates(predicates, new_predicates, hidden_predicates, archived_predicates, data, dtypes, predicate_id, {k: all_predicates[k] for k in keys if k not in ['hidden', 'archived', 'default']})

def add_predicate(feature_values, all_predicates=None):
    return add_predicates([feature_values], all_predicates)

def copy_predicate(predicate_id):
    predicates = load_predicates(predicates_path)
    predicate = predicates['default'][int(predicate_id)]
    return add_predicate(predicate.feature_values, predicates)

def delete_predicate(predicate_id):
    all_predicates = load_predicates(predicates_path)
    keys = list(all_predicates.keys())
    hidden_predicates = all_predicates['hidden']
    archived_predicates = all_predicates['archived']
    predicates = all_predicates['default']
    data = load_data(data_path)
    dtypes = load_dtypes(dtypes_path)
    all_predicate_id = load_predicate_id(predicate_id_path)
    return update_predicates({k:v for k,v in predicates.items() if k!=predicate_id}, [], hidden_predicates, archived_predicates, data, dtypes, all_predicate_id, {k: all_predicates[k] for k in keys if k not in ['hidden', 'archived', 'default']})

def negate_predicate(predicate_id):
    all_predicates = load_predicates(predicates_path)
    keys = list(all_predicates.keys())
    hidden_predicates = all_predicates['hidden']
    predicates = all_predicates['default']
    archived_predicates = all_predicates['archived']
    data = load_data(data_path)
    dtypes = load_dtypes(dtypes_path)
    predicates[int(predicate_id)].negate()
    all_predicate_id = load_predicate_id(predicate_id_path)
    return update_predicates(predicates, [], hidden_predicates, archived_predicates, data, dtypes, all_predicate_id, {k: all_predicates[k] for k in keys if k not in ['hidden', 'archived', 'default']})

def hide_predicates(predicate_ids, hide=False):
    predicates = load_predicates(predicates_path)
    keys = list(predicates.keys())
    for predicate_id in predicate_ids:
        key = int(predicate_id)
        if key in predicates['default']:
            predicates['hidden'][key] = predicates['default'][key]
            del predicates['default'][key]
        else:
            if not hide:
                predicates['default'][key] = predicates['hidden'][key]
                del predicates['hidden'][key]
    data = load_data(data_path)
    dtypes = load_dtypes(dtypes_path)
    all_predicate_id = load_predicate_id(predicate_id_path)
    return update_predicates(predicates['default'], [], predicates['hidden'], predicates['archived'], data, dtypes, all_predicate_id, {k: predicates[k] for k in keys if k not in ['hidden', 'archived', 'default']})

def hide_predicate(predicate_id, hide=False):
    return hide_predicates([predicate_id])

def focus_predicate(predicate_id):
    predicates = load_predicates(predicates_path)
    if predicate_id is None:
        if 'focus_hidden' in predicates:
            for k,v in predicates['focus_hidden'].items():
                predicates['default'][k] = v
        else:
            predicates['focus_hidden'] = {}
    else:
        predicates['focus_hidden'] = {}
        key = int(predicate_id)
        for k,v in predicates['default'].items():
            if k != key:
                predicates['hidden'][k] = v
                predicates['focus_hidden'][k] = v
        predicates['default'] = {key: predicates['default'][key]}
    data = load_data(data_path)
    dtypes = load_dtypes(dtypes_path)
    all_predicate_id = load_predicate_id(predicate_id_path)
    return update_predicates(predicates['default'], [], predicates['hidden'], predicates['archived'], data, dtypes, all_predicate_id, {'focus_hidden': predicates['focus_hidden']})

def update_predicate_clause(predicate_id, feature, values):
    data = load_data(data_path)
    dtypes = load_dtypes(dtypes_path)
    all_predicate_id = load_predicate_id(predicate_id_path)
    predicates = load_predicates(predicates_path)
    predicate = predicates['default'][int(predicate_id)]
    predicate.refit(data, feature, values)
    predicates['default'][int(predicate_id)] = predicate    
    return update_predicates(predicates['default'], [], predicates['hidden'], predicates['archived'], data, dtypes, all_predicate_id)

def inspect_predicate_feature(predicate_id, feature, features, predicates=None):
    if predicates is None:
        predicates = load_predicates(predicates_path)['default']
    predicate = predicates[int(predicate_id)]
    spec = plot_predicate(predicate, feature, target_features)
    data = load_data(data_path)
    dtypes = load_dtypes(dtypes_path)
    feature_domains = get_feature_domains(dtypes.keys(), data, dtypes)
    feature_values = predicate.feature_values
    return {'plot': spec, 'display': None, 'features': features, 'feature_domains': feature_domains, 'feature_values': feature_values,'dtypes': dtypes}

def archive_predicate(predicate_id):
    key = int(predicate_id)
    predicates = load_predicates(predicates_path)
    if key in predicates['default']:
        predicates['archived'][key] = predicates['default'][key]
        del predicates['default'][key]
    else:
        predicates['default'][key] = predicates['archived'][key]
        del predicates['archived'][key]
    if 'focus_hidden' in predicates:
        for k,v in predicates['focus_hidden'].items():
            predicates['default'][k] = v
        predicates['focus_hidden'] = {}
    data = load_data(data_path)
    dtypes = load_dtypes(dtypes_path)
    all_predicate_id = load_predicate_id(predicate_id_path)
    
    print(predicates)
    return update_predicates(predicates['default'], [], predicates['hidden'], predicates['archived'], data, dtypes, all_predicate_id, {k: predicates[k] for k in predicates.keys() if k not in ['hidden', 'archived', 'default']})

@app.route("/add_predicate", methods=['PUT'])
def app_add_predicate():
    request_data = request.get_json(force=True)
    feature_values = request_data['feature_values']
    res = add_predicate(feature_values)
    return json.dumps(res)

@app.route("/add_predicates", methods=['PUT'])
def app_add_predicates():
    request_data = request.get_json(force=True)
    feature_values = request_data['feature_values']
    res = add_predicates(feature_values)
    return json.dumps(res)

@app.route("/copy_predicate", methods=['PUT'])
def app_copy_predicate():
    request_data = request.get_json(force=True)
    predicate_id = request_data['predicate_id']
    res = copy_predicate(predicate_id)
    return json.dumps(res)

@app.route("/delete_predicate", methods=['DELETE'])
def app_delete_predicate():
    request_data = request.get_json(force=True)
    predicate_id = request_data['predicate_id']
    res = delete_predicate(predicate_id)
    return json.dumps(res)

@app.route("/negate_predicate", methods=['PUT'])
def app_negate_predicate():
    request_data = request.get_json(force=True)
    predicate_id = request_data['predicate_id']
    res = negate_predicate(predicate_id)
    return json.dumps(res)

@app.route("/hide_predicates", methods=['POST'])
def app_hide_predicates():
    request_data = request.get_json(force=True)
    predicate_ids = request_data['predicate_ids']
    hide = request_data['hide']
    res = hide_predicates(predicate_ids, hide)
    return json.dumps(res)

@app.route("/hide_predicate", methods=['POST'])
def app_hide_predicate():
    request_data = request.get_json(force=True)
    predicate_id = request_data['predicate_id']
    hide = request_data['hide']
    res = hide_predicate(predicate_id, hide)
    return json.dumps(res)

@app.route("/focus_predicate", methods=['POST'])
def app_focus_predicate():
    request_data = request.get_json(force=True)
    predicate_id = request_data['predicate_id']
    res = focus_predicate(predicate_id)
    return json.dumps(res)

@app.route("/update_predicate_clause", methods=['POST'])
def app_update_predicate_clause():
    request_data = request.get_json(force=True)
    predicate_id = request_data['predicate_id']
    feature = request_data['feature']
    values = request_data['values']
    res = update_predicate_clause(predicate_id, feature, values)
    return json.dumps(res)

@app.route("/archive_predicate", methods=['POST'])
def app_archive_predicate():
    request_data = request.get_json(force=True)
    predicate_id = request_data['predicate_id']
    res = archive_predicate(predicate_id)
    return json.dumps(res)

@app.route("/inspect_predicate_feature", methods=['POST'])
def app_inspect_predicate_feature():
    request_data = request.get_json(force=True)
    predicate_id = request_data['predicate_id']
    feature = request_data['feature']
    predicates = load_predicates(predicates_path)['default']
    predicate = predicates[int(predicate_id)]
    features = predicate.feature_mask.columns.tolist()
    if feature is None:
        feature = predicate.feature_mask.columns[0]
    res = inspect_predicate_feature(predicate_id, feature, features, predicates=predicates)
    res['feature'] = feature
    return json.dumps(res)

if __name__ == "__main__":
    app.run(debug=True)
from copyreg import pickle
from aem import con
from flask import Flask, render_template, request
import os
import json
import pandas as pd
import numpy as np
import pickle
import altair as alt
from predicate_display import PredicateDisplay, PredicateEntry
from predicate_induction import Predicate

app = Flask(__name__)
app.secret_key = ''
app.config['SESSION_TYPE'] = 'filesystem'
path = os.path.dirname(os.path.realpath(__file__))
colors = ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#17becf", "#bcbd22"]
data_path = 'static/data/data.csv'
dtypes_path = 'static/data/dtypes.json'
target = 'score'
num_bins = 100

session_id = "49324312"
predicates_path = f'static/data/predicates_{session_id}.pkl'
predicate_id_path = f'static/data/predicate_id_{session_id}.json'

@app.route("/")
def index():
    save_predicates({}, predicates_path)
    save_predicate_id(0, predicate_id_path)
    return render_template("index.html")

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
    hist = pd.concat([predicates[i].get_distribution(data[target], num_bins).assign(predicate_id=i) for i in range(len(predicates))])
    range_ = colors[:len(predicates)]
    spec = json.loads(alt.Chart(hist).mark_bar().encode(
        x='bin',
        y='density',
        color=alt.Color('predicate_id', scale=alt.Scale(domain=list(range(len(predicates))), range=range_), legend=None)
    ).configure_mark(
        opacity=0.5,
    ).configure_scale(bandPaddingInner=0).to_json())
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

def update_predicates(feature_values_list=None, copy_predicate_indices=None, negate_predicate_indices=None, delete_predicate_indices=None):
    predicates = load_predicates(predicates_path)
    data = load_data(data_path)
    dtypes = load_dtypes(dtypes_path)
    predicate_id = load_predicate_id(predicate_id_path)

    if feature_values_list is not None:
        parsed_feature_values_list = [{feature: parse_feature_values(feature, values, dtypes) for feature,values in feature_values.items()} for feature_values in feature_values_list]
        added_predicates = [Predicate(feature_values, dtypes) for feature_values in parsed_feature_values_list]
    else:
        added_predicates = []

    if copy_predicate_indices is not None:
        copied_predicates = [Predicate(predicates[int(i)].feature_values, dtypes) for i in copy_predicate_indices]
    else:
        copied_predicates = []

    if negate_predicate_indices is not None:
        for i in negate_predicate_indices:
            predicates[int(i)].negate()

    new_predicates = added_predicates + copied_predicates
    new_display = {i+predicate_id: PredicateDisplay(i+predicate_id, new_predicates[i].feature_values, dtypes).display() for i in range(len(new_predicates))}
    save_predicate_id(predicate_id + len(new_predicates), predicate_id_path)
    for i in range(len(new_predicates)):
        new_predicates[i].fit(data)
        predicates[i+predicate_id] = new_predicates[i]
    save_predicates(predicates, predicates_path)

    spec = plot_predicates(predicates, target, num_bins)
    return {'plot': spec, 'display': new_display}

@app.route("/predicate", methods=['PUT'])
def add_predicate():
    request_data = request.get_json(force=True)
    feature_values = request_data['feature_values']
    copy_index = request_data['copy_index']
    negate_index = request_data['negate_index']
    if feature_values is not None:
        res = update_predicates([feature_values], None, None, None)
    if copy_index is not None:
        res = update_predicates(None, [copy_index], None, None)
    if negate_index is not None:
        res = update_predicates(None, None, [negate_index], None)
    return json.dumps(res)

@app.route("/predicate", methods=["DELETE"])
def delete_predicate():
    request_data = request.get_json(force=True)
    index = request_data['index']
    res = update_predicates(None, None, None, [index])
    return json.dumps(res)

if __name__ == "__main__":
    app.run(debug=True)
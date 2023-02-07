import numpy as np
import pandas as pd

class Predicate:
    
    def __init__(self, feature_values, dtypes):
        self.feature_values = feature_values
        self.dtypes = dtypes
        self.feature_mask = pd.DataFrame()
        self.mask = None
        self.feature_invmask = pd.DataFrame()
        self.negated = False
        
    def get_feature_mask(self, d, feature, values):
        if self.dtypes[feature] == 'binary':
            return d == values[0]
        elif self.dtypes[feature] == 'nominal':
            return d.isin(values)
        elif self.dtypes[feature] in ['ordinal', 'numeric', 'date']:
            return (d >= values[0]) & (d <= values[1])
        
    def fit(self, data):
        for feature, values in self.feature_values.items():
            self.feature_mask[feature] = self.get_feature_mask(data[feature], feature, values)
        for feature, values in self.feature_values.items():
            self.feature_invmask[feature] = self.feature_mask[[f for f in self.feature_mask.columns if f != feature]].all(axis=1)
        self.mask = self.feature_mask.all(axis=1)
        
    def predict(self, data):
        if self.negated:
            return data.loc[~self.mask]
        else:
            return data.loc[self.mask]
    
    # def refit(self, data, feature, values):
    #     self.feature_values[feature] = values
    #     self.feature_mask[feature] = self.get_feature_mask(data[feature], feature, values)
    #     self.feature_invmask[feature] = self.mask
    #     for f in self.feature_invmask.columns:
    #         if f != feature:
    #             self.feature_invmask[feature] = self.feature_invmask[f] & self.feature_mask[feature]
    #     self.mask = self.mask & self.feature_mask[feature]

    def refit(self, data, feature, values):
        self.feature_values[feature] = values
        self.feature_mask[feature] = self.get_feature_mask(data[feature], feature, values)
        for feature, values in self.feature_values.items():
            self.feature_invmask[feature] = self.feature_mask[[f for f in self.feature_mask.columns if f != feature]].all(axis=1)
        self.mask = self.feature_mask.all(axis=1)
        
    def get_distribution(self, d, num_bins=25):
        counts, bins = np.histogram(self.predict(d), bins=num_bins)
        counts = counts / counts.sum()
        bins = (bins[:-1] + bins[1:]) / 2
        return pd.DataFrame({'bin': bins, 'density': counts})

    def negate(self):
        self.negated = ~self.negated
        
    def __repr__(self):
        return ' AND '.join([f'{k}={v}' for k,v in self.feature_values.items()])
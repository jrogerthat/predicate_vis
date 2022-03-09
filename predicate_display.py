import numpy as np
import pandas as pd

class PredicateDisplay:
    
    def __init__(self, predicate_id, feature_values, dtypes):
        self.predicate_id = predicate_id
        self.feature_values = feature_values
        self.dtypes = dtypes
        
    def display_feature(self, feature, values):
        html = f"""
            <span class='predicate-clause'>{feature}={values}</span>
        """
        return html
    
    def display_style(self):
        style = """
        <style>
        .predicate-clause {
            border: 1px solid #000000 !important;
            margin: 2px;
            padding: 5px;
            border-radius: 7px;
            background-color: #adadad;
            display: inline-block
        }
        
        .predicate-button {
            margin: 2px;
            padding: 5px;
            border-radius: 7px;
            display: inline-block
        }
        
        .predicate {
            border: 1px solid;
            margin: 10px;
            border-radius: 5px;
            background-color: #dfdfdf;
            display: block;
            align-items: center;
            padding: 5px;
        }
        
        .negate {
            background-color: #ff2631 !important;
            display: none
        }

        </style>
        """
        return style
    
    def display_buttons(self):
        hide = f"<button id='hide-{self.predicate_id}-button' class='predicate-button hide-button'><i class='fa fa-eye'></i></button>"
        copy = f"<button id='copy-{self.predicate_id}-button' class='predicate-button copy-button'><i class='fa fa-copy'></i></button>"
        delete = f"<button id='delete-{self.predicate_id}-button' class='predicate-button delete-button'><i class='fa fa-trash'></i></button>"
        negate = f"<button id='negate-{self.predicate_id}-button' class='predicate-button negate-button'><i class='fa fa-ban'></i></button>"
        color = f"<button id='color-{self.predicate_id}-button' class='predicate-button color-button'><i class='fa fa-palette'></i></button>"
        buttons = [copy, negate, color, hide, delete]
        return ''.join(buttons)
        
    def display(self):
        buttons = self.display_buttons()
        html = f"""
        <div class='predicate'>
        <div class='predicate-clauses'>
        <span id=negate-{self.predicate_id} class='predicate-clause negate'>NOT</span>
        {''.join([self.display_feature(feature, values) for feature, values in self.feature_values.items()])}
        </div>
        <div class='predicate-options'>{buttons}</div>
        </div>
        """
        style = self.display_style()
        return html + style

class PredicateEntry:
    
    def display_text(self):
        text = "<div><textarea rows='4' cols='50'></textarea></div>"
        return text
    
    def display_buttons(self):
        add = "<button class='predicate-button'><i class='fa fa-plus'></i></button>"
        buttons = [add]
        return f"<div>{''.join(buttons)}</div>"
    
    def display(self):
        text = self.display_text()
        buttons = self.display_buttons()
        return text + buttons
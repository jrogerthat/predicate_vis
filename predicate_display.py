import numpy as np
import pandas as pd

class PredicateDisplay:
    
    def __init__(self, predicate_id, color, feature_values, dtypes):
        self.predicate_id = predicate_id
        self.color = color
        self.feature_values = feature_values
        self.dtypes = dtypes
        
    def display_feature(self, feature, values):
        if (self.dtypes[feature] == 'nominal'):
            values_str = values
        else:
            id = f'predicate-{self.predicate_id}-{feature}'
            values_str = f"[<span id={id}-left>{values[0]}</span>, <span id={id}-right>{values[1]}</span>]"
        html = f"""
            <span id=predicate-{self.predicate_id}-{feature} class='predicate-clause predicate-{self.predicate_id}-clause'>{feature}={values_str}</span>
            <div id=predicate-{self.predicate_id}-{feature}-select class=predicate-{self.predicate_id}-select style='display:none'></div>
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
        focus = f"<button id='focus-{self.predicate_id}-button' class='predicate-button focus-button'><i class='fa fa-arrows-to-eye'></i></button>"
        hide = f"<button id='hide-{self.predicate_id}-button' class='predicate-button hide-button'><i class='fa fa-eye-slash'></i></button>"
        copy = f"<button id='copy-{self.predicate_id}-button' class='predicate-button copy-button'><i class='fa fa-copy'></i></button>"
        delete = f"<button id='delete-{self.predicate_id}-button' class='predicate-button delete-button'><i class='fa fa-trash'></i></button>"
        negate = f"<button id='negate-{self.predicate_id}-button' class='predicate-button negate-button'><i class='fa fa-ban'></i></button>"
        color = f"<button id='color-{self.predicate_id}-button' class='predicate-button color-button' style='color:{self.color}'><i class='fa fa-palette'></i></button>"
        inspect = f"<button id='inspect-{self.predicate_id}-button' class='predicate-button inspect-button'><i class='fa fa-magnifying-glass'></i></button>"
        archive = f"<button id='archive-{self.predicate_id}-button' class='predicate-button archive-button' disabled><i class='fa fa-box-archive'></i></i></button>"

        hide_plot = f"<button id='hide-plot-{self.predicate_id}-button' class='predicate-button hide-plot-button' style='color:{self.color}'><i class='fa fa-chart-simple'></i></i></button>"
        # buttons = [copy, negate, hide_plot, focus, hide, inspect, archive, delete]
        buttons = [copy, negate, hide_plot, focus, hide, delete]
        return ''.join(buttons)
        
    def display(self):
        buttons = self.display_buttons()
        html = f"""
        <div id='predicate-{self.predicate_id}' class='predicate default'>
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
class Control:

    def __init__(self, y_features):
        self.y_features = y_features
    
    def display(self):
        x_select = f"""
            <div>
            <span>x</span>
            <select id=select-x></select>
            </div>
        """.strip().replace('\n', '')
        y_select = f"""
            <div>
            <span>y</span>
            <select id=select-y class='selectpicker' multiple>{''.join([f'<option selected>{feature}</option>' for feature in self.y_features])}</select>
            </div>
        """.strip().replace('\n', '')
        return x_select + y_select
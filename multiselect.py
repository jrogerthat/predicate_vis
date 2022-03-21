class Multiselect:

    def __init__(self, id, features):
        self.id = id
        self.features = features
    
    def display(self):
        return f"<select id={self.id} class='selectpicker' multiple>{''.join([f'<option selected>{feature}</option>' for feature in self.features])}</select>"
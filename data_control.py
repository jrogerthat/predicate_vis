class DataSet:

    def __init__(self, data_id):
        self.id = data_id
        self.features = ""

        self.data_path = 'static/data/augmented_superstore_data.csv'
        self.dtypes_path = 'static/data/augmented_superstore_dtypes.json'
        # data_path = 'static/data/sensor_data.csv'
        # dtypes_path = 'static/data/sensor_dtypes.json'
        self.target = 'iforest_score'
        self.features = ['Order-Date', 'Ship-Mode', 'Segment', 'State', 'Sub-Category', 'Discount', 'temperature', 'precipitation']
        # features = ['sensor_id', 'location_id', 'voltage', 'iforest_score']
        # "Order-Date": "date", "Ship-Mode": "nominal", "Segment": "nominal", "State": "nominal", "Sub-Category": "nominal", "Quantity": "ordinal", "Unit-Price": "numeric", "Unit-Cost": "numeric", "iforest_score": "numeric", "precipitation": "numeric", "temperature": "numeric"
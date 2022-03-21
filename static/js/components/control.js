class Control {
    constructor(container_id, features, feature_values, dtypes, plot){
        this.container_id = container_id
        this.features = features
        this.dtypes = dtypes
        this.feature_values = feature_values
        this.plot = plot
        this.filters = {}
        this.filter_selects = {}

        this.make_dropdowns()
        $(".dropdown").change(function(obj){
            console.log('change dropdown')
            var id = obj.currentTarget.id
            var id_array = id.split("-")
            var label = id_array[0]
            var kind = id_array[1]
            var value = $("#" + id).val()
            this.update_dropdown(kind, label, value, true)
            this.plot.plot()
        }.bind(this))
        this.make_filters()
    }

    make_filters(){
        var filters_container = document.createElement("div")
        var filters_container_id = this.container_id + "-filters"
        filters_container.id = filters_container_id

        var control_height =  $("#" + this.container_id).height()
        var dropdown_height = $("#" + this.container_id + "-dropdown").height()
        filters_container.style.height = (control_height - dropdown_height - 115) + "px"
        $("#" + this.container_id).append(filters_container)

        var header = document.createElement("div")
        header.id = "filter-header"
        header.className = "header"
        header.innerHTML = "Filters"
        filters_container.appendChild(header)
    }

    add_filter(feature, values){
        this.filters[feature] = values
        var div = document.createElement("div")
        var id = feature + "-filter"
        div.id = id
        div.className = "filter"
        $("#" + this.container_id + "-filters").append(div)

        var select = new Select(id, feature, this.feature_values[feature], values, this.dtypes[feature], true, null, null)
        select.make_select()
        this.filter_selects[feature] = select
    }

    remove_filter(feature){
        delete this.filters[feature]
        this.filter_selects[feature].remove_select()
        delete this.filter_selects[feature]
    }

    make_dropdown(dropdown_container_id, label_width, function_width, feature_width, label, functions, features){
        if (functions != null){
            var functions_features = {'function': functions, 'feature': features}
        } else {
            var functions_features = {'feature': features}
        }

        var dropdown_div = document.createElement("div")
        var dropdown_div_id = "dropdown-" + label
        dropdown_div.id = dropdown_div_id
        dropdown_div.className = "dropdown-row"
        $("#" + dropdown_container_id).append(dropdown_div)
        var dropdown = new Dropdown(dropdown_div_id, label, functions_features, {'label': label_width, 'function': function_width, 'feature': feature_width})
        dropdown.make_dropdowns()
        return dropdown
    }

    make_dropdowns(){
        var label_width = .2
        var function_width = .25
        var feature_width = .54

        var header = document.createElement("div")
        header.id = "dropdowns-header"
        header.className = "header"
        header.innerHTML = "Encoding"
        $("#" + this.container_id).append(header)

        var dropdown_container = document.createElement("div")
        var dropdown_container_id = this.container_id + "-dropdown"
        dropdown_container.id = dropdown_container_id
        $("#" + this.container_id).append(dropdown_container)

        this.x_dropdown = this.make_dropdown(dropdown_container_id, label_width, function_width, feature_width, 'x', ['bin'], this.features)
        this.y_dropdown = this.make_dropdown(dropdown_container_id, label_width, function_width, feature_width, 'y', ['mean', 'count'], this.features)
    }

    update_dropdown(kind, label, value, update_plot){
        if (typeof value === 'object' && value != null){
            var values = value['values']
            var feature = value['feature']
            this.update_color_filter(feature, values)
        } else {
            var values = null
            var feature = value
        }
        $("#" + label + "-" + kind + "-dropdown").val(feature)
        var func = (kind === 'function') ? '_func' : ''
        var field = label + func

        if (update_plot){
            this.plot.update_field(field, value)
            // this.plot.plot()
        }
    }

    update_plot(plot){
        this.plot = plot
        this.update_dropdown('function', 'x', this.plot.x_func, false)
        this.update_dropdown('feature', 'x', this.plot.x, false)
        this.update_dropdown('function', 'y', this.plot.y_func, false)
        this.update_dropdown('feature', 'y', this.plot.y, false)
        this.update_dropdown('feature', 'mark', this.plot.mark, false)
        this.update_dropdown('function', 'color', this.plot.color_func, false)
        this.update_dropdown('feature', 'color', this.plot.color, false)
        this.update_dropdown('feature', 'size', this.plot.size, false)
        this.update_dropdown('feature', 'shape', this.plot.shape, false)
        for (var feature in this.plot.filter){
            this.add_filter(feature, this.plot.filter[feature])
        }
        this.plot.plot()
    }
}
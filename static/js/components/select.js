class Select {
    constructor(container_id, label, values, selected, dtype, show_label, left_slider, right_slider, dropdown_target, dropdown_function){
        this.container_id = container_id
        this.label = label
        this.values = values
        this.selected = selected
        this.show_label = show_label
        this.update_dtype(dtype)
        this.label_selected = {}
        if (this.label != null){
            this.label_selected[this.label] = this.selected
        }

        if (left_slider != null){
            this.left_slider = left_slider
            this.make_left_slider = false
        } else {
            this.left_slider = "input." + this.label + "-slider-input[data-index=" + 0 + "]"
            this.make_left_slider = true
        }
        if (right_slider != null){
            this.right_slider = right_slider
            this.make_right_slider = false
        } else {
            this.right_slider = "input." + this.label + "-slider-input[data-index=" + 1 + "]"
            this.make_right_slider = true
        }
        this.dropdown_target = dropdown_target
        this.dropdown_function = dropdown_function
    }

    make_dropdown(container){
        var dropdown = document.createElement("select")
        dropdown.setAttribute('data-live-search', "true");
        dropdown.setAttribute('data-width', "100%");
        var multiple = document.createAttribute("multiple")
        dropdown.setAttributeNode(multiple)
        dropdown.id = "select-" + this.label
        dropdown.className = "select-dropdown"
        for (var i=0; i<this.values.length; i++){
            var option = document.createElement("option")
            option.innerHTML = this.values[i]
            option.value = this.values[i]
            if (this.selected.includes(this.values[i])){
                option.selected = true
            }
            dropdown.appendChild(option)
        }
        container.appendChild(dropdown)
        $("#select-" + this.label).selectpicker()
        $("#select-" + this.label).change(function(){
            this.selected = $("#select-" + this.label).val()
            if (this.dropdown_target != null){
                var selected_str = '[' + this.selected.join(', ') + ']'
                $(this.dropdown_target).html(selected_str)
            }
            if (this.dropdown_function != null){
                this.dropdown_function(this.selected)
            }
        }.bind(this))
    }

    days_to_date(days){
        var value = new Date(this.values[0])
        value.setDate(value.getDate() + days)
        var value = new Date(value).toISOString().split('T')[0]
        return value
    }

    date_to_days(date){
        var milli_to_days = 1000*60*60*24
        var value = (Date.parse(date) - Date.parse(this.values[0])) / milli_to_days
        return value
    }

    update_dtype(dtype){
        this.dtype = dtype
        if (this.dtype == 'date'){
            this.step = 1
        } else {
            this.step = .01
        }
    }

    update_selected_dropdown(){
        console.log(update_selected_dropdown)
        $("#select-" + this.label).selectpicker('deselectAll')
        $("#select-" + this.label).selectpicker("val", this.selected)
        if (this.dropdown_target != null){
            console.log('update_target')
        }
    }

    update_selected_slider(){
        if (this.dtype == 'date'){
            $("#" + this.label + "-slider-bar").slider('values', 0, this.date_to_days(this.selected[0]))
            $("#" + this.label + "-slider-bar").slider('values', 1, this.date_to_days(this.selected[1]))
        } else {
            $("#" + this.label + "-slider-bar").slider('values', 0, this.selected[0])
            $("#" + this.label + "-slider-bar").slider('values', 1, this.selected[1])
        }

        if (this.left_slider.substring(0,5) == 'input'){
            $(this.left_slider).val(this.selected[0])
        } else {
            $(this.left_slider).html(this.selected[0])
        }
        if (this.right_slider.substring(0,5) == 'input'){
            $(this.right_slider).val(this.selected[1])
        } else {
            $(this.right_slider).html(this.selected[1])
        }
    }

    update_selected(selected){
        this.selected = selected
        if (this.dtype == 'nominal'){
            this.update_selected_dropdown()
        } else {
            this.update_selected_slider()
        }
    }

    make_input(index){
        var input = document.createElement("input")
        input.type = "text"
        input.className = this.label + "-slider-input slider-input"
        input.setAttribute('data-index', index);
        input.value = this.selected[index]
        return input
    }

    make_slider_container(){
        var slider_container = document.createElement("div")
        slider_container.id = this.label + "-slider"

        var slider_container_bar = document.createElement("div")
        var slider_container_bar_id = this.label + "-slider-bar"
        slider_container_bar.id = slider_container_bar_id
        slider_container.append(slider_container_bar)

        var slider_container_input = document.createElement("div")
        slider_container_input.className = "slider-input-container"
        slider_container_input.id = this.label + "-slider-input-container"
        slider_container.append(slider_container_input)

        if (this.make_left_slider){
            this.left_input = this.make_input(0)
            slider_container_input.append(this.left_input)
        }
        if (this.make_right_slider){
            this.right_input = this.make_input(1)
            slider_container_input.append(this.right_input)
        }

        return slider_container
    }

    make_slider_content(container_id){
        if (this.dtype == 'date'){
            var min = this.date_to_days(this.values[0])
            var max = this.date_to_days(this.values[1])
            var values = [this.date_to_days(this.selected[0]), this.date_to_days(this.selected[1])]
        } else {
            var min = this.values[0]
            var max = this.values[1]
            var values = this.selected
        }

        $("#" + container_id).slider({
            range: true,
            min: min,
            max: max,
            step: this.step,
            values: values,
            slide: function(event, ui) {
                if (this.dtype == 'date'){
                    var values = [this.days_to_date(ui.values[0]), this.days_to_date(ui.values[1])]
                } else {
                    var values = ui.values
                }
                this.update_selected(values)
            }.bind(this)
        });
    }

    make_slider(container){
        var slider_container = this.make_slider_container()
        container.appendChild(slider_container)
        this.make_slider_content(this.label + "-slider-bar")
    }

    remove_select(){
        $("#select-container-" + this.label).remove()
    }

    update_label(label){
        this.remove_select()
        if (this.label != null){
            this.label_selected[this.label] = this.selected
        }
        this.label = label
    }

    make_select(){
        var container = document.createElement("div")
        container.className = "select-container"
        var container_id = "select-container-" + this.label
        $("#" + container_id).remove()
        container.id = container_id
        
        var label = document.createElement("div")
        label.className = "filter-label"
        if (this.show_label){
            label.innerHTML = this.label
        }
        container.append(label)
        $("#" + this.container_id).append(container)
        if (this.dtype == 'nominal'){
            this.make_dropdown(container)
        } else {
            this.make_slider(container)
        }
    }

    update_feature_values(feature, dtype, values, selected){
        this.update_label(feature)
        this.values = values
        this.update_dtype(dtype)
        this.make_select()
        if (selected == null){
            this.update_selected(values)
        } else {
            this.update_selected(selected)
        }
    }
}
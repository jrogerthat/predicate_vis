class Dropdown{
    constructor(container_id, label, options, widths){
        this.container_id = container_id
        this.label = label
        this.options = options
        this.widths = widths
        this.container_width = $("#" + this.container_id).width()
        this.values = {}
    }

    set_attribute(dropdown_id, att){
        $("#" + dropdown_id).change(function(){
            var val = $("#" + dropdown_id).val()
            this.values[att] = val
        }.bind(this));
    }

    set_attributes(){
        for (var att in this.options){
            this.values[att] = ""
            var dropdown_id = this.label + "-" + att + "-dropdown"
            this.set_attribute(dropdown_id, att)
        }
    }

    make_dropdowns(){
        this.container = document.createElement("div")
        var dropdown_label = document.createElement("div")
        dropdown_label.style.display = "inline-block"
        var width = this.widths['label'] * this.container_width
        dropdown_label.style.width = width + "px"
        dropdown_label.innerHTML = this.label
        dropdown_label.className = "dropdown-label"
        this.container.appendChild(dropdown_label)

        var keys = Object.keys(this.options)
        for (var i=0; i<keys.length; i++){
            var dropdown = this.make_dropdown(this.label, keys[i], this.options[keys[i]], i==keys.length-1)
            this.container.appendChild(dropdown)
        }
        $("#" + this.container_id).append(this.container)
        this.set_attributes()
    }

    make_dropdown(label, key, options, is_outer){
        var dropdown_container = document.createElement("div")
        dropdown_container.style.display = "inline-block"

        if (is_outer){
            dropdown_container.className = "dropdown-container-outer"
        } else {
            dropdown_container.className = "dropdown-container"
        }
        var width = this.widths[key] * this.container_width
        dropdown_container.style.width = width + "px"

        var dropdown = document.createElement("select")
        dropdown.name = label + "-" + key + "-dropdown"
        dropdown.id = label + "-" + key + "-dropdown"
        dropdown.className = "dropdown"
        dropdown.style.width = "100%"
        dropdown_container.appendChild(dropdown)
        var default_option = document.createElement("option")
        default_option.value = ""
        dropdown.appendChild(default_option)
        for (var i=0; i<options.length; i++){
            var option = document.createElement("option")
            option.value = options[i]
            option.innerHTML = options[i]
            dropdown.appendChild(option)
        }
        return dropdown_container
    }
}
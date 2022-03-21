class PredicateVis {
    constructor(){
        this.margin = 15
        this.make_dashboard()
        this.make_text_entry()
        this.select = {}
        this.features = {}

        this.bind_predicate_button()
        this.bind_mode_buttons()
        this.plot = null
        this.inspect_clicked = null
        this.mode = 'default'
    }

    bind_mode_buttons(){
        $("#mode").append("<button id='default-mode-button' class='mode-button selected-button'><i class='fa fa-file'></i></button>")
        $("#mode").append("<button id='hidden-mode-button' class='mode-button'><i class='fa fa-eye'></i></button>")
        $("#mode").append("<button id='archived-mode-button' class='mode-button'><i class='fa fa-box-archive'></i></button>")

        $("#default-mode-button").click(function(){
            $(".mode-button").removeClass("selected-button")
            $("#default-mode-button").addClass("selected-button")
            $(".default").show()
            $(".hidden").hide()
            $(".archived").hide()
        })
        $("#hidden-mode-button").click(function(){
            $(".mode-button").removeClass("selected-button")
            $("#hidden-mode-button").addClass("selected-button")
            $(".default").hide()
            $(".hidden").show()
            $(".archived").hide()
        })
        $("#archived-mode-button").click(function(){
            $(".mode-button").removeClass("selected-button")
            $("#archived-mode-button").addClass("selected-button")
            $(".default").hide()
            $(".hidden").hide()
            $(".archived").show()
        })
    }

    make_dashboard(){
        var rows_columns = {'columns': [
            {'id': 'control-container', 'width': .2, 'rows': [
                {'id': 'mode', 'height': .1},
                {'id': 'main', 'height': .65},
                {'id': 'entry', 'height': .25},
            ]},
            {'id': 'plot-container', 'width': .8, 'rows': [
                {'id': 'plot', 'height': 1.}
            ]}
        ]}

        var panels = ['control-container', 'plot-container']
        var headers = []

        this.dashboard = new Dashboard("PredicateVis", "dashboard", rows_columns, panels, headers, this.margin)
        this.dashboard.make_header()
        this.dashboard.make_content()
        this.dashboard.make_footer()
        this.dashboard.make_panels()

        this.dashboard.adjust_height_children("control-container", -15)
        this.dashboard.adjust_height_children("plot-container", -15)
        this.dashboard.adjust_width_children("plot-container", -30)

        $("#main").append("<div id=predicates></div><div id=control style=display:none></div>")
    }

    make_text_entry(){
        $("#entry").append(
            "<div id='predicate-text-container' style='padding: 10px'><div><textarea id='predicate-text' style='height: 150px'></textarea></div><div><button id='predicate-button'><i class='fa fa-plus'></i></button></div></div>"
        )
        $("#predicate-text").width($("#entry").width() - 2*this.margin)
    }

    parse_clause(string){
        if (string.includes("=")){
            var string_array = string.split("=")
            var feature = string_array[0]
            var values_string = string_array[1]
            if (values_string[0] == '[' && values_string[values_string.length-1] == ']'){
                var values = values_string.substring(1, values_string.length-1).split(',')
            }
        } else {
            return null
        }
        return {'feature': feature, 'values': values}
    }

    parse_feature_values(string){
        var feature_values = {}
        var clauses = string.split(' and ')
        for (var i=0; i<clauses.length; i++){
            var clause = this.parse_clause(clauses[i])
            feature_values[clause['feature']] = clause['values']
        }
        return feature_values
    }

    update_select_x(options, selected){
        console.log('update_select_x')
        console.log(options)
        console.log(selected)
        var options_str = ""
        for (var i=0; i<options.length; i++){
            if (options[i] == selected){
                options_str += "<option selected>" + options[i] + "</option>"
            } else {
                options_str += "<option>" + options[i] + "</option>"
            }
        }
        $("#select-x").append(options_str)
    }

    update_filters(feature_values, feature_domains, dtypes){
        for (var feature in feature_values){
            var select = new Select("control", feature, feature_domains[feature], feature_values[feature], dtypes[feature], true)
            select.make_select()
        }
    }

    make_control(feature_values, feature_domain, dtypes){
        console.log('make_control')
        console.log(dtypes)
        $("#control").empty()
        var features = Object.keys(feature_values)
        this.control = new Control("control", features, feature_domain, dtypes, null)
        for (var feature in feature_values){
            if (feature != features[0]){
                this.control.add_filter(feature, feature_values[feature])
            }
        }
    }

    request(url, data, type, saveplot){
        var self = this
        return $.ajax({
            url: url,
            type: type,
            dataType: "JSON",
            data: JSON.stringify(data),
            success: function(resp){
                if (resp != null){
                    if (saveplot){
                        self.plot = resp['plot']
                    }
                    if ('features' in resp){
                        console.log(resp)
                        self.make_control(resp['feature_values'], resp['feature_domains'], resp['dtypes'])
                        // self.update_select_x(resp['features'], resp['feature'])
                        // self.update_filters(resp['feature_values'], resp['feature_domains'], resp['dtypes'])
                    }
                    self.update_plot_display(resp['plot'], resp['display'], resp['feature_values'], resp['feature_domains'], resp['dtypes'])
                }
            }
        });
    }

    copy_predicate(predicate_id){
        this.request('/copy_predicate', {'predicate_id': predicate_id}, 'PUT', true)
    }

    bind_button(button, predicate_id, func){
        $("#" + button + "-" + predicate_id + "-button").click(function(){
            func(predicate_id)
        })
    }

    bind_copy_button(predicate_id){
        $("#copy-" + predicate_id + "-button").click(function(){
            this.copy_predicate(predicate_id)
        }.bind(this))
    }

    negate_predicate(predicate_id){
        $("#negate-" + predicate_id).toggle()
        this.request('/negate_predicate', {'predicate_id': predicate_id}, 'PUT', true)
    }

    bind_negate_button(predicate_id){
        $("#negate-" + predicate_id + "-button").click(function(){
            this.negate_predicate(predicate_id)
        }.bind(this))
    }

    delete_predicate(predicate_id){
        this.request('/delete_predicate', {'predicate_id': predicate_id}, 'DELETE', true)
    }

    bind_delete_button(predicate_id){
        $("#delete-" + predicate_id + "-button").click(function(){
            this.delete_predicate(predicate_id)
        }.bind(this))
    }

    inspect_predicate_feature(predicate_id, feature){
        this.request('/inspect_predicate_feature', {'predicate_id': predicate_id, 'feature': feature}, 'POST', false)
    }

    uninspect_predicate_feature(){
        this.plot_spec(this.plot)
    }

    bind_inspect_button(predicate_id){
        $("#inspect-" + predicate_id + "-button").click(function(event){
            var clicked = event.currentTarget.id.split('-')[1]
            $(".inspect-button").removeClass("selected-button")
            $(".archive-button").prop('disabled', true)
            $(".copy-button").prop('disabled', false)
            $(".negate-button").prop('disabled', false)
            $(".hide-plot-button").prop('disabled', false)
            $("#hide-plot-" + clicked + "-button").removeClass("unselected-button")
            $(".focus-button").prop('disabled', false)
            $(".hide-button").prop('disabled', false)
            if (this.inspect_clicked == clicked){
                this.inspect_clicked = null
                this.uninspect_predicate_feature()
                $(".predicate").show()
                $("#control").hide()
            } else {
                this.inspect_clicked = clicked
                this.inspect_predicate_feature(predicate_id, null)
                $("#inspect-" + clicked + "-button").addClass("selected-button")
                $("#archive-" + clicked + "-button").prop('disabled', false)
                $("#copy-" + clicked + "-button").prop('disabled', true)
                $("#negate-" + clicked + "-button").prop('disabled', true)
                $("#hide-plot-" + clicked + "-button").prop('disabled', true)
                $("#hide-plot-" + clicked + "-button").addClass("unselected-button")
                $("#focus-" + clicked + "-button").prop('disabled', true)
                $("#hide-" + clicked + "-button").prop('disabled', true)
                $(".predicate").hide()
                $("#predicate-" + clicked).show()
                $("#control").show()
            }
        }.bind(this))
    }

    archive_predicate(predicate_id){
        this.request('/archive_predicate', {'predicate_id': predicate_id}, 'POST', true)
    }

    bind_archive_button(predicate_id){
        $("#archive-" + predicate_id + "-button").click(function(){
            $("#predicate-" + predicate_id).toggleClass("archived")
            $("#predicate-" + predicate_id).removeClass("default")
            $("#predicate-" + predicate_id).removeClass("hidden")
            if (this.mode != 'archived'){
                this.uninspect_predicate_feature()
                $(".archived").hide()
                $("#control").hide()
                $(".default").show()
                $(".focus-hidden").show()
                $(".predicate").removeClass("focus-hidden")
                this.archive_predicate(predicate_id)
                $("#inspect-" + predicate_id + "-button").removeClass("selected-button")
                $("#focus-" + predicate_id + "-button").removeClass("selected-button")
            }
        }.bind(this))
    }

    hide_predicate(predicate_id){
        $(".hidden").hide()
        this.request('/hide_predicate', {'predicate_id': predicate_id}, 'POST', true)
    }

    bind_hide_button(predicate_id){
        $("#hide-" + predicate_id + "-button").click(function(){
            var hidden = $("#predicate-" + predicate_id).hasClass("hidden")
            if (hidden){
                $("#predicate-" + predicate_id).removeClass("hidden")
                $("#hide-" + predicate_id + "-button").html('<i class="fa fa-eye-slash" aria-hidden="true"></i>')
            } else {
                $("#predicate-" + predicate_id).addClass("hidden")
                $("#hide-" + predicate_id + "-button").html('<i class="fa fa-eye" aria-hidden="true"></i>')
            }
            this.hide_predicate(predicate_id)
        }.bind(this))
    }

    focus_predicate(predicate_id){
        this.request('/focus_predicate', {'predicate_id': predicate_id}, 'POST', true)
    }

    bind_focus_button(predicate_id){
        $("#focus-" + predicate_id + "-button").click(function(){
            var focused = $("#focus-" + predicate_id + "-button").hasClass("selected-button")
            if (focused){
                $(".focus-hidden").show()
                $(".predicate").removeClass("focus-hidden")
                $("#focus-" + predicate_id + "-button").removeClass("selected-button")
                this.focus_predicate(null)
            } else {
                $(".predicate").addClass("focus-hidden")
                $("#predicate-" + predicate_id).removeClass("focus-hidden")
                $("#focus-" + predicate_id + "-button").addClass("selected-button")
                $(".focus-hidden").hide()
                this.focus_predicate(predicate_id)
            }
        }.bind(this))
    }

    bind_hide_plot_button(predicate_id){
        $("#hide-plot-" + predicate_id + "-button").click(function(){
            var unselected = $("#hide-plot-" + predicate_id + "-button").hasClass("unselected-button")
            if (unselected){
                $("#hide-plot-" + predicate_id + "-button").removeClass("unselected-button")
            } else {
                $("#hide-plot-" + predicate_id + "-button").addClass("unselected-button")
            }
        }.bind(this))
    }

    bind_buttons(predicate_id){
        this.bind_copy_button(predicate_id, this)
        this.bind_negate_button(predicate_id)
        this.bind_hide_plot_button(predicate_id)
        this.bind_focus_button(predicate_id)

        this.bind_delete_button(predicate_id)
        this.bind_inspect_button(predicate_id)
        this.bind_archive_button(predicate_id)
        this.bind_hide_button(predicate_id)
    }

    plot_spec(spec){
        $('#plot').empty()
        vegaEmbed('#plot', spec, {"actions": true})
        $('summary').remove()
    }

    add_select(predicate_id, feature_values, feature_domains, dtypes){
        this.select[predicate_id] = {}
        for (var feature in feature_values){
            var container_id = 'predicate-' + predicate_id + '-' + feature + '-select'
            var left_slider = '#predicate-' + predicate_id + '-' + feature + '-left'
            var right_slider = '#predicate-' + predicate_id + '-' + feature + '-right'
            this.select[predicate_id][feature] = new Select(container_id, feature, feature_domains[feature], feature_values[feature], dtypes[feature], false, left_slider, right_slider)
            this.select[predicate_id][feature].make_select()
        }
    }

    bind_feature_select(index, feature){
        var id = "predicate-" + index + "-" + feature
        $("#" + id).click(function(){
            this.select_predicate_feature(index, feature)
        }.bind(this))
    }

    bind_features_select(index, feature_values){
        for (var feature in feature_values){
            this.bind_feature_select(index, feature)
        }
    }

    update_plot_display(plot, display, feature_values, feature_domains, dtypes){
        this.plot_spec(plot)
        if (display != null){
            for (var i in display){
                $("#predicates").append(display[i])
                this.bind_buttons(i)
                this.add_select(i, feature_values[i], feature_domains[i], dtypes)
                this.bind_features_select(i, feature_values[i])
            }
        }
    }

    add_predicate(feature_values){
        this.request('/add_predicate', {'feature_values': feature_values}, 'PUT', true)
    }

    bind_predicate_button(){
        $("#predicate-button").click(function(){
            var string = $("#predicate-text").val()
            var feature_values = this.parse_feature_values(string)
            if (feature_values != null){
                this.add_predicate(feature_values)
            }
        }.bind(this))
    }

    select_predicate_feature(predicate_id, feature){
        var id = "predicate-" + predicate_id + "-" + feature
        $(".predicate-" + predicate_id + "-select").hide()
        $("#" + id + "-select").show()
        $(".predicate-" + predicate_id + "-clause").removeClass("selected-feature")
        $("#predicate-" + predicate_id + "-" + feature).addClass("selected-feature")
    }
}
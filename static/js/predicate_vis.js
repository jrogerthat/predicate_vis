class PredicateVis {
    constructor(predicate_features){
        this.predicate_features = predicate_features
        this.margin = 15
        this.make_dashboard()
        this.make_text_entry()
        this.select = {}
        this.features = {}

        this.bind_predicate_button()
        this.make_control()
        // this.bind_mode_buttons()
        this.plot = null
        this.inspect_clicked = null
        this.mode = 'default'
    }

    make_control(){
        var hide = "<button id='hide-button'><i class='fa fa-eye'></i></button>"
        var filter = "<select id=predicate-filter class='selectpicker' multiple>"
        for (var i=0; i<this.predicate_features.length; i++){
            filter += "<option>" + this.predicate_features[i] + "</option>"
        }
        filter += "<option selected>*</option></select>"
        var container = "<div style='display: flex;'><div>" + hide + "</div><div>" + filter + "</div></div>"
        $("#mode").append(container)

        $("#predicate-filter").change(function(event){
            var selected_array = []
            var selected = event.currentTarget.selectedOptions
            for (var i=0; i<selected.length; i++){
                selected_array.push(selected[i].value)
            }
            if (selected_array[selected_array.length-1] == '*'){
                if (selected_array.length == 1){
                    $(".predicate").removeClass('filtered')
                } else {
                    $(".predicate").addClass('filtered')
                    for (var j=0; j<selected_array.length-1; j++){
                        $('.predicate-w-' + selected_array[j]).removeClass('filtered')
                    }
                }
            } else {
                $(".predicate").addClass('filtered')
                var classname = '.predicate-' + selected_array.sort().join('-')
                console.log(classname)
                $(classname).removeClass('filtered')
            }
            var filtered = $('.filtered')
            console.log(filtered)
            var filtered_predicate_ids = []
            for (var i=0; i<filtered.length; i++){
                filtered_predicate_ids.push(filtered[i].id.split('-')[1])
            }
            this.hide_predicates(filtered_predicate_ids, true)
        }.bind(this))
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
                {'id': 'mode', 'height': .075},
                {'id': 'main', 'height': .725},
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

    // make_control(feature_values, feature_domain, dtypes){
    //     console.log('make_control')
    //     console.log(dtypes)
    //     $("#control").empty()
    //     var features = Object.keys(feature_values)
    //     this.control = new Control("control", features, feature_domain, dtypes, null)
    //     for (var feature in feature_values){
    //         if (feature != features[0]){
    //             this.control.add_filter(feature, feature_values[feature])
    //         }
    //     }
    // }

    request(url, data, type, saveplot, self){
        if (self == null){
            var self = this
        }
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
                    // if ('features' in resp){
                    //     console.log(resp)
                    //     self.make_control(resp['feature_values'], resp['feature_domains'], resp['dtypes'])
                    //     // self.update_select_x(resp['features'], resp['feature'])
                    //     // self.update_filters(resp['feature_values'], resp['feature_domains'], resp['dtypes'])
                    // }
                    self.update_plot_display(resp['plot'], resp['display'], resp['feature_values'], resp['feature_domains'], resp['dtypes'])
                }
            }
        });
    }

    copy_predicate(predicate_id){
        this.request('/copy_predicate', {'predicate_id': predicate_id}, 'PUT', true, null)
    }

    bind_copy_button(predicate_id){
        $("#copy-" + predicate_id + "-button").click(function(){
            this.copy_predicate(predicate_id)
        }.bind(this))
    }

    negate_predicate(predicate_id){
        $("#negate-" + predicate_id).toggle()
        this.request('/negate_predicate', {'predicate_id': predicate_id}, 'PUT', true, null)
    }

    bind_negate_button(predicate_id){
        $("#negate-" + predicate_id + "-button").click(function(){
            this.negate_predicate(predicate_id)
        }.bind(this))
    }

    delete_predicate(predicate_id){
        this.request('/delete_predicate', {'predicate_id': predicate_id}, 'DELETE', true, null)
    }

    bind_delete_button(predicate_id){
        $("#delete-" + predicate_id + "-button").click(function(){
            this.delete_predicate(predicate_id)
        }.bind(this))
    }

    inspect_predicate_feature(predicate_id, feature){
        this.request('/inspect_predicate_feature', {'predicate_id': predicate_id, 'feature': feature}, 'POST', false, null)
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

    update_predicate_clause(predicate_id, feature, values){
        this.request('/update_predicate_clause', {'predicate_id': predicate_id, 'feature': feature, 'values': values}, 'POST', true)
    }

    // bind_update_predicate_clause(predicate_id, feature_values, dtypes){
    //     for (var feature in feature_values){
    //         if (dtypes[feature] == 'nominal'){
    //             console.log("#select-predicate-" + predicate_id + "-" + feature)
    //             $("#select-predicate-" + predicate_id + "-" + feature).remove()
    //             $("#select-predicate-" + predicate_id + "-" + feature).change(function(){
    //                 console.log(feature)
    //             })
    //         } else {

    //         }
    //     }
    // }

    archive_predicate(predicate_id){
        this.request('/archive_predicate', {'predicate_id': predicate_id}, 'POST', true, null)
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

    hide_predicate(predicate_id, hide){
        $(".hidden").hide()
        this.request('/hide_predicate', {'predicate_id': predicate_id, 'hide': hide}, 'POST', true, null)
    }

    hide_predicates(predicate_ids, hide){
        $(".hidden").hide()
        this.request('/hide_predicates', {'predicate_ids': predicate_ids, 'hide': hide}, 'POST', true, null)
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
            this.hide_predicate(predicate_id, false)
        }.bind(this))
    }

    focus_predicate(predicate_id){
        this.request('/focus_predicate', {'predicate_id': predicate_id}, 'POST', true, null)
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
            this.hide_predicate(predicate_id, false)
        }.bind(this))
    }

    bind_buttons(predicate_id){
        this.bind_copy_button(predicate_id)
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
            var dtype = dtypes[feature]
            var container_id = 'predicate-' + predicate_id + '-' + feature + '-select'
            if (dtype == 'nominal'){
                var left_slider = null
                var right_slider = null
                var dropdown_target = '#predicate-' + predicate_id + '-' + feature + '-values'
            } else {
                var left_slider = '#predicate-' + predicate_id + '-' + feature + '-left'
                var right_slider = '#predicate-' + predicate_id + '-' + feature + '-right'
                var dropdown_target = null
            }

            var self = this
            function update_predicate_clause(predicate_id, feature, values){
                self.request('/update_predicate_clause', {'predicate_id': predicate_id, 'feature': feature, 'values': values}, 'POST', true, self)
            }
            function update_function(values){
                update_predicate_clause(predicate_id, feature, values)
            }

            this.select[predicate_id][feature] = new Select(container_id, 'predicate-' + predicate_id + '-' + feature, feature_domains[feature], feature_values[feature], dtypes[feature], false, left_slider, right_slider, dropdown_target, update_function)
            this.select[predicate_id][feature].make_select()
            $("#select-" + feature).change(function(event){
                var selected_options = event.currentTarget.selectedOptions
                var selected = []
                for (var i=0; i<selected_options.length; i++){
                    selected.push(selected_options[i].value)
                }
                $("#predicate-" + predicate_id + "-" + feature + "-values").html('[' + selected.join(', ') + ']')
            })
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
                this.bind_buttons(i, feature_values[i], dtypes)
                this.add_select(i, feature_values[i], feature_domains[i], dtypes)
                this.bind_features_select(i, feature_values[i])
            }
        }
    }

    add_predicate(feature_values){
        this.request('/add_predicate', {'feature_values': feature_values}, 'PUT', true)
    }

    add_predicates(feature_values){
        this.request('/add_predicates', {'feature_values': feature_values}, 'PUT', true)
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
        console.log('select_predicate_feature')
        var predicate_id_str = "predicate-" + predicate_id
        var predicate_feature_id_str = "predicate-" + predicate_id + "-" + feature
        $("#" + predicate_feature_id_str + "-select").toggle()
        $("#" + predicate_feature_id_str).toggleClass("selected-feature")
        $("." + predicate_id_str + "-select").not("#" + predicate_feature_id_str + "-select").hide()
        $("." + predicate_id_str).not("#" + predicate_feature_id_str).removeClass("selected-feature")


        // console.log(".predicate-" + predicate_id + "-select")
        // var id = "predicate-" + predicate_id + "-" + feature
        // console.log("#" + id + "-select")
        // $(".predicate-" + predicate_id + "-select").hide()
        // $("#" + id + "-select").show()
        // $(".predicate-" + predicate_id + "-clause").removeClass("selected-feature")
        // $("#predicate-" + predicate_id + "-" + feature).addClass("selected-feature")
    }
}
class PredicateVis {
    constructor(){
        this.margin = 15
        this.make_dashboard()
        this.make_text_entry()

        $("#predicate-button").click(function(){
            var string = $("#predicate-text").val()
            var feature_values = this.parse_feature_values(string)
            if (feature_values != null){
                this.add_predicate(feature_values, null, null).then(function(resp){
                    this.plot_spec(resp['plot'])
                    for (var i in resp['display']){
                        $("#predicates").append(resp['display'][i])
                        this.bind_buttons(i)
                    }
                }.bind(this))
            }
        }.bind(this))
    }

    bind_button(id, feature_values, copy_index, negate_index){
        $("#" + id).click(function(){
            this.add_predicate(feature_values, copy_index, negate_index).then(function(resp){
                this.plot_spec(resp['plot'])
                for (var i in resp['display']){
                    $("#predicates").append(resp['display'][i])
                    this.bind_buttons(i)
                }
            }.bind(this))
        }.bind(this))
    }

    bind_copy_button(index){
        this.bind_button("copy-" + index + "-button", null, index, null)
    }

    bind_negate_button(index){
        var id = "negate-" + index + "-button"
        $("#" + id).click(function(){
            $("#negate-" + index).toggle()
        })
        this.bind_button(id, null, null, index)
    }

    bind_buttons(index){
        this.bind_copy_button(index)
        this.bind_negate_button(index)
    }

    make_dashboard(){
        var rows_columns = {'columns': [
            {'id': 'predicates-container', 'width': .2, 'rows': [
                {'id': 'predicates', 'height': .75},
                {'id': 'entry', 'height': .25},
            ]},
            {'id': 'main', 'width': .8, 'rows': [
                // {'id': 'stats', 'height': .2},
                {'id': 'plot', 'height': 1.}
            ]}
        ]}

        var panels = ['predicates-container', 'main']
        var headers = []

        this.dashboard = new Dashboard("PredicateVis", "dashboard", rows_columns, panels, headers, this.margin)
        this.dashboard.make_header()
        this.dashboard.make_content()
        this.dashboard.make_footer()
        this.dashboard.make_panels()

        this.dashboard.adjust_height_children("predicates-container", -15)
        this.dashboard.adjust_height_children("main", -15)
        this.dashboard.adjust_width_children("main", -30)
    }

    make_text_entry(){
        $("#entry").append(
            "<div id='predicate-text-container' style='padding: 10px'><div><textarea id='predicate-text' style='height: 150px'></textarea></div><div><button id='predicate-button'><i class='fa fa-plus'></i></button></div></div>"
        )
        $("#predicate-text").width($("#entry").width() - 2*this.margin)
    }

    plot_spec(spec){
        $('#plot').empty()
        vegaEmbed('#plot', spec, {"actions": true})
        $('summary').remove()
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

    add_predicate(feature_values, copy_index, negate_index){
        return $.ajax({
            url: '/predicate',
            type: "PUT",
            dataType: "JSON",
            data: JSON.stringify({'feature_values': feature_values, 'copy_index': copy_index, 'negate_index': negate_index}),
            success: function(resp){
                if (resp != null){
                    return resp
                }
            }
        });
    }

    delete_predicate(index){
        return $.ajax({
            url: '/predicate',
            type: "DELETE",
            dataType: "JSON",
            data: JSON.stringify({'index': index}),
            success: function(resp){
                if (resp != null){
                    return resp
                }
            }
        });
    }

}
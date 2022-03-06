class DashboardPanel {

    constructor(parent, id, width, height, is_row){
        this.parent = parent
        this.id = id
        this.width = width
        this.height = height
        this.is_row = is_row
    }

    get_width(){
        var parent_width = $("#" + this.parent).width()
        return this.width * parent_width
    }

    get_height(){
        var parent_height = $("#" + this.parent).height()
        return this.height * parent_height
    }

    make_panel(){
        var width = this.get_width()
        var height = this.get_height()
        var div = document.createElement("div")
        if (this.is_row){
            div.className = "panel-row"
        }
        div.id = this.id
        div.setAttribute("style", "width:" + width + "px; height:" + height + "px")
        $("#" + this.parent).append(div)
    }
}

class Dashboard {

    constructor(name, parent, rows_columns, panels, headers, margin){
        this.name = name
        this.parent = parent
        this.rows_columns = rows_columns
        this.panels = panels
        this.headers = headers
        this.margin = margin
    }

    make_content(){
        var div = document.createElement("div")
        div.id = this.parent + "-content"
        div.className = "content panel-row"
        $("#" + this.parent).append(div)
        $("#" + this.parent + "-content").css('padding', this.margin/2);
    }

    make_panel(parent, id, is_row, width, height, rows, columns){
        var panel = new DashboardPanel(parent, id, width, height, is_row)
        panel.make_panel()

        if (columns != null){
            for (var i=0; i<columns.length; i++){
                this.make_column(id, columns[i]['id'], columns[i]['width'], columns[i]['rows'], columns[i]['columns'])
            }
        }
        if (rows != null){
            for (var i=0; i<rows.length; i++){
                this.make_row(id, rows[i]['id'], rows[i]['height'], rows[i]['rows'], rows[i]['columns'])
            }
        }
    }

    make_column(parent, id, width, rows, columns){
        this.make_panel(parent, id, false, width, 1, rows, columns)
    }

    make_row(parent, id, height, rows, columns){
        var is_row = rows != null || columns != null
        this.make_panel(parent, id, is_row, 1, height, rows, columns)
    }

    make_columns(parent, columns){
        for (var i=0; i<columns.length; i++){
            this.make_column(parent, columns[i]['id'], columns[i]['width'], columns[i]['rows'], columns[i]['columns'])
        }
    }

    make_rows(parent, rows){
        for (var i=0; i<rows.length; i++){
            this.make_row(parent, rows[i]['id'], rows[i]['height'], rows[i]['rows'], rows[i]['columns'])
        }
    }

    add_header(div_id, header){
        var div = document.createElement("div")
        header_id = div_id + "-header"
        div.id = header_id
        $("#" + header_id).addClass("header")
        div.innerHTML = header
        $("#" + div_id).prepend(div)
    }

    make_panels(){
        var content = this.parent + "-content"
        for (var type in this.rows_columns){
            if (type == 'rows'){
                this.make_rows(content, this.rows_columns[type])
            } else if (type == 'columns'){
                this.make_columns(content, this.rows_columns[type])
            }
        }
        for (var i=0; i<this.panels.length; i++){
            $("#" + this.panels[i]).addClass("panel")
        }
        $(".panel").css('margin', this.margin/2);
        for (var div_id in this.headers){
            this.add_header(div_id, this.headers[div_id])
        }
    }

    make_header(){
        var nav = document.createElement("nav")
        nav.className = "navbar navbar-expand-lg navbar-light bg-light"
        var a = document.createElement("a")
        a.className = "navbar-brand"
        a.href = "#"
        a.innerHTML = this.name

        $("#" + this.parent).append(nav)
        nav.appendChild(a)
    }

    make_footer(){
        var footer = document.createElement("footer")
        footer.className = "footer"
        var div = document.createElement("div")
        div.className = "container"
        var span = document.createElement("span")
        span.className = "text-muted"

        $("#" + this.container_id).append(footer)
        footer.appendChild(div)
        div.appendChild(span)
    }

    adjust_height(id, val){
        var new_val = $("#" + id).height() + val
        $("#" + id).height(new_val)
    }

    adjust_height_children(id, val){
        if (id != ''){
            this.adjust_height(id, val)
            var num_children = $("#" + id).children().length
            $("#" + id).children().each(function(idx, itm){
                this.adjust_height_children(itm.id, val/num_children)
            }.bind(this))
        }
    }

    adjust_width(id, val){
        var new_val = $("#" + id).width() + val
        $("#" + id).width(new_val)
    }

    adjust_width_children(id, val){
        if (id != ''){
            this.adjust_width(id, val)
            var num_children = $("#" + id).children().length
            $("#" + id).children().each(function(idx, itm){
                this.adjust_width_children(itm.id, val/num_children)
            }.bind(this))
        }
    }
}
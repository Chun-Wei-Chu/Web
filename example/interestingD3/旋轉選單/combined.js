(function(global){

    /* smoothie.js */
    var Extender = {
        extend: function() {
            arguments[0] = arguments[0] || {};
            for (var i = 1; i < arguments.length; i++)
            {
                for (var key in arguments[i])
                {
                    if (arguments[i].hasOwnProperty(key))
                    {
                        if (typeof(arguments[i][key]) === 'object') {
                            if (arguments[i][key] instanceof Array) {
                                arguments[0][key] = arguments[i][key];
                            } else {
                                arguments[0][key] = Extender.extend(arguments[0][key], arguments[i][key]);
                            }
                        } else {
                            arguments[0][key] = arguments[i][key];
                        }
                    }
                }
            }
            return arguments[0];
        }
    };

    /* Simple Pie-Styled Control */
    var tgpDonutWheel = function(options){

        /* Private vars */
        var self, center, pie;

        function TgpDonutWheel(options) {
            this.options = Extender.extend({}, TgpDonutWheel.defaultOptions, options);
            this.data = [];
            self = this;
        }

        TgpDonutWheel.defaultOptions = {
            mouseover: function (svg, data, i) {},
            mouseout: function (svg, data, i) {},
            click: function (svg, data, i) {},
            dblclick: function (svg, data, i) {},
            touchstart: function (svg, data, i) {},
            touchmove: function (svg, data, i) {},
            touchend: function (svg, data, i) {},
            touchcancel: function (svg, data, i) {},
            width: 225,
            height: 225,
            transparentArcSize: 70, // in %
            paddings: {
                pieSectorAngularPadding: 2.5, // in degrees
                backgroundPadding: 4,
                pieAreaPadding: 13
            },
            radii: {
                rSmall1: 40.5,
                rSmall2: 30.5,
                rSmallBullsEye: 20.5
            }
        };

        /* Private members */
        var arcTween = function(d){

            var interpolate = d3.interpolate(
                [d.startAngle[0], d.endAngle[0]],
                [d.startAngle[1], d.endAngle[1]]
            );

            var arc = function(start, end, or) {
                return d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(or)
                    .startAngle(start)
                    .endAngle(end)();
            };

            return function(t) {
                return arc(interpolate(t)[0], interpolate(t)[1], center.x - self.options.paddings.pieAreaPadding);
            };

        };

        var redraw = function(){

            if (!pie) return;

            var degsToRadians = d3.scale.linear().domain([0, 360]).range([0, 2 * Math.PI]);

            var paddings = self.data.length * self.options.paddings.pieSectorAngularPadding,
                pieSectorAngularSize = (360 - paddings) / self.data.length;

            self.data = self.data.map(function(d, i){

                var startAngle = degsToRadians(pieSectorAngularSize * i + self.options.paddings.pieSectorAngularPadding * (i + 1)),
                    endAngle = degsToRadians(pieSectorAngularSize) + startAngle,
                    /* Angle for enter selection */
                    enterAngle = (endAngle - startAngle) / 2 + startAngle;

                return {
                    class: d.class,
                    text: d.text,
                    startAngle: [d.startAngle ? d.startAngle[1] : enterAngle, startAngle],
                    endAngle: [d.endAngle ? d.endAngle[1] : enterAngle, endAngle],
                    d: d3.svg.arc()
                        .innerRadius(0)
                        .outerRadius(center.x - self.options.paddings.pieAreaPadding)
                        .startAngle(startAngle)
                        .endAngle(endAngle)()
                };
            });

            var pieSectors = pie.selectAll("path")
                .data(self.data, function(d){return d.class});

            /* Enter */
            pieSectors.enter()
                .insert("path")
                .attr("class", function(d){ return d.class })
                .on("click", function(d, i){ self.options.click.call(this, pie, d, i) })
                .on("dblclick", function(d, i){ self.options.dblclick.call(this, pie, d, i) })
                .on("mouseover", function(d, i){ self.options.mouseover.call(this, pie, d, i) })
                .on("mouseout", function(d, i){ self.options.mouseout.call(this, pie, d, i) })
                .on("touchstart", function(d, i){ self.options.touchstart.call(this, pie, d, i) })
                .on("touchmove", function(d, i){ self.options.touchmove.call(this, pie, d, i) })
                .on("touchend", function(d, i){ self.options.touchend.call(this, pie, d, i) })
                .on("touchcancel", function(d, i){ self.options.touchcancel.call(this, pie, d, i) })

                /* Entering... */

                .transition()
                .duration(500)
                .attrTween("d", function(d, i, a) {
                    return arcTween.call(this, d);
                });

            /* Update */
            pieSectors.transition()
                .duration(500)
                .attrTween("d", function(d, i, a) {
                     return arcTween.call(this, d);
                });

            /* Exit */
            pieSectors.exit()
                .transition()
                .duration(500)
                .attrTween("d", function(d, i, a) {
                    var delta = d.endAngle[1] - d.startAngle[1];

                    d.startAngle = d3.permute(d.startAngle, [1, 0]);
                    d.endAngle = d3.permute(d.endAngle, [1, 0]);

                    d.startAngle[1] =  d.startAngle[0] + delta / 2;
                    d.endAngle[1] = d.endAngle[0] - delta / 2;

                    return arcTween.call(this, d);
                })
                .remove();
        };

        TgpDonutWheel.prototype.paintTo = function(selector){

            this.svg = d3.select(selector)
                .append("svg")
                .attr("width", this.options.width + 5)
                .attr("height", this.options.height + 5);

            center = {x: this.options.width / 2, y: this.options.height / 2};

            var grad = this.svg
                .append("defs")
                .append("radialGradient")
                .attr("id", "grad-inner-grey")
                .attr("cx", ".5")
                .attr("cy", ".5")
                .attr("r", ".73");

            grad.append("stop")
                .attr("offset", ".01")
                .attr("stop-color", "#fff")
                .attr("stop-opacity", "1");

            grad.append("stop")
                .attr("offset", ".77")
                .attr("stop-color", "#aaa")
                .attr("stop-opacity", "1");

            var g = this.svg
                .append("g");

            /* Inner black background */
            g.append("g")
                .append("circle")
                .attr("cx", center.x)
                .attr("cy", center.y)
                .attr("r", center.x - this.options.paddings.backgroundPadding)
                .style("fill", "rgba(56,56,58,.9)");

            pie = g.append("g").attr("transform", "translate(" + center.x + "," + center.y + ")").append("g");

            redraw();

            /* Transparent arc path generator */
            var outerArc = d3.svg.arc()
                // Percentage of width (70% by default)
                .innerRadius(d3.scale.linear().domain([0, 100]).range([0, center.x])(this.options.transparentArcSize))
                .outerRadius(center.x)
                .startAngle(0)
                .endAngle(2 * Math.PI);

            g.append("path")
                .attr("transform", "translate(" + center.x + "," + center.y + ")")
                .attr("d", outerArc)
                .style("fill", "rgba(0,0,0,.1)")
                .style("pointer-events", "none");

            /* Small inner circle 1 */
            g.append("g")
                .append("circle")
                .attr("cx", center.x)
                .attr("cy", center.y)
                .attr("r", this.options.radii.rSmall1)
                .style("fill", "#E4E4E4");

            /* Small inner circle 2 */
            g.append("g")
                .append("circle")
                .attr("cx", center.x)
                .attr("cy", center.y)
                .attr("r", this.options.radii.rSmall2)
                .style("fill", "url(#grad-inner-grey)");

            /* Small inner circle 3 (bullseye) */
            g.append("g")
                .append("circle")
                .attr("cx", center.x)
                .attr("cy", center.y)
                .attr("r", this.options.radii.rSmallBullsEye)
                .style("fill", "rgba(67,72,77,.9)");

            return this;
        };

        TgpDonutWheel.prototype.setData = function(data){

            var self = this;

            var oldData = this.data;
            this.data = data;

            this.data.forEach(function(d, i, a){
                oldData.forEach(function(d2, i2, a2) {
                    if (d.class === d2.class)
                        self.data[i] = oldData[i2];
                });
            });

            redraw();
            return this;
        };

        TgpDonutWheel.prototype.selectByClass = function(className){

            if (!pie) return this;

            pie.selectAll("path").classed("pie-selected", function(d){return d.class === className;});
            pie.selectAll("path").text(function(d){return d.text}).attr("style","font-color:#fff");

            return this;
        };

        return new TgpDonutWheel(options);
    };

    function tgpChart(options){
        return new TgpChart(options);
    }

    global.tgpDonutWheel = tgpDonutWheel;

    function setHover(d, doSet){d3.select(this).classed(d.class + "-hover", doSet)}

    var data = [{class: "pie-1", text:"1"},
        {class: "pie-2", text:"2"},
        {class: "pie-3", text:"3"},
        {class: "pie-4", text:"4"},
        {class: "pie-5", text:"5"}
    ];

    var locked = false;

    var donut = tgpDonutWheel(
        {
            /*dblclick: function(pie, d){

                if (!locked){

                    if (data.length == 5)
                        data.push({class: "pie-6", text:""});
                    else if (data.length == 6)
                        data.pop();
                    donut.setData(data);
                    locked = true;
                    setTimeout(function(){locked = false}, 500);

                }

            },*/
            click: function(pie, d){
                donut.selectByClass(d.class);

                var radsToDegs = d3.scale.linear().domain([0, 2 * Math.PI]).range([0, 360]);

                var a = (d.endAngle[1] - d.startAngle[1]) / 2;

                a = 180 - radsToDegs(a) - radsToDegs(d.startAngle[1]);

                //console.log(a);

                pie.transition()
                    .duration(1000)
                    .attr("transform", "rotate(" + a + ")");
            },
            mouseover: function(pie, d){ return setHover.call(this, d, !('ontouchstart' in window))},
            mouseout: function(pie, d){ return setHover.call(this, d, false)},
            touchstart: function(pie, d){ return setHover.call(this, d, true)},
            touchend: function(pie, d){ return setHover.call(this, d, false)},
            touchcancel: function(pie, d){ return setHover.call(this, d, false)}
        }).setData(data).paintTo("#chart").selectByClass("pie-1");


})(window);
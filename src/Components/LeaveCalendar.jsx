import React from 'react'
import './LeaveCalendar.css'

class LeaveCalendar extends React.Component {

    renderTableData() {
        const { payload } = this.props
        return payload.leaveCalendar.map((employee, index) => {
            return (
                <tr key={index}>
                    <td>{employee}</td>
                </tr>
            )
        })
    }
    render() {
        const { payload } = this.props

        let updatedTime
        if (payload.updated.leaveCalendar === undefined) {
        } else {
            updatedTime = payload.updated.leaveCalendar
        }
        return (
            <div>
                <table id='onLeave'>
                    <thead>
                        <tr>
                            <th>ON LEAVE</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.renderTableData()}
                    </tbody>
                </table>
                <div className="updatedTime">
                    Last Updated: {updatedTime}
                </div>
            </div>
        );
    }
}
export default LeaveCalendar
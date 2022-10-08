import React from 'react'
import './Presence.css'

const defaultCellStyle = { backgroundColor: 'white' }
class Presence extends React.Component {
    renderTableHeader() {
        var filteredHeader = ['district', 'primary', 'backup', 'secondary backup']
        return filteredHeader.map((key, index) => {
            return <th style={defaultCellStyle} key={index}>{key.toUpperCase()}</th>
        })
    }
    renderTableData() {
        const { payload } = this.props

        let primaryNAStyle = {}
        let backupNAStyle = {}
        let secondaryBackupNAStyle = {}
        return payload.nasAssignment.map((entry, index) => {
            const { district, primary, backup, secondary_backup } = entry // Destructuring

            // First Check if Primary is on the calendar and the backup isn't THIS HIGHLIGHTS THE BACKUP
            if (payload['leaveCalendar'].includes(primary) && !payload['leaveCalendar'].includes(backup)) {
                primaryNAStyle = { backgroundColor: 'white', fontWeight: 'bold', opacity: '0.5'  }
                backupNAStyle = { color: 'white', backgroundColor: 'rgb(112, 196, 105)', fontWeight: 'bolder' }
                secondaryBackupNAStyle = { backgroundColor: 'white', fontWeight: 'bolder', opacity: '0.5'  }
            } // Check if primary and backup are on the calendar THIS HIGHLIGHTS THE SECONDARY BACKUP
            else if (payload['leaveCalendar'].includes(primary) && payload['leaveCalendar'].includes(backup)) {
                primaryNAStyle = { backgroundColor: 'white', fontWeight: 'bolder', opacity: '0.5'  }
                backupNAStyle = { backgroundColor: 'white', fontWeight: 'bolder', opacity: '0.5' }
                secondaryBackupNAStyle = { color: 'white', backgroundColor: 'rgb(255, 0, 0)', fontWeight: 'bolder' }
            } // Else if Primary is in HIGHLIGHT THE PRIMARY 
            else {
                primaryNAStyle = { color: 'white', backgroundColor: 'rgb(112, 196, 105)', fontWeight: 'bolder' }
                backupNAStyle = { backgroundColor: 'white', fontWeight: 'bolder', opacity: '0.5'  }
                secondaryBackupNAStyle = { backgroundColor: 'white', fontWeight: 'bolder', opacity: '0.5'  }
            }
            return (
                <tr style={defaultCellStyle} key={index}>
                    <td>{district}</td>
                    <td style={primaryNAStyle}>{primary}</td>
                    <td style={backupNAStyle}>{backup}</td>
                    <td style={secondaryBackupNAStyle}>{secondary_backup}</td>
                </tr>
            )
        })
    }
    render() {
        const { payload } = this.props
        let updatedTime

        if (payload.updated.nasAssignment === undefined) {

        } else {
            updatedTime = payload.updated.nasAssignment
        }
        return (
            <div>
                <table id='assignments'>
                    <tbody>
                        <tr>{this.renderTableHeader()}</tr>
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

export default Presence
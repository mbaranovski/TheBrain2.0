import React from 'react'
import { FlatList, Text, View } from 'react-native'
import { compose, graphql } from 'react-apollo'
import { connect } from 'react-redux'

import Header from './Header'
import PageTitle from './PageTitle'
import Video from './Video'

import lessonsQuery from '../../client/shared/graphql/queries/lessons'
import currentLessonQuery from '../../client/shared/graphql/queries/currentLesson'

class Lectures extends React.Component {
  renderLecture = ({ item }) => {
    return (
      <View style={{ width: '50%', padding: 10 }} key={item._id}>
        <View>
          <Video videoId={item.youtubeId} height={100} />
          <View pointerEvents="none" style={item.position >= this.props.currentLesson.Lesson.position ? style.overlay : {}} />
        </View>
        <Text style={style.title}>{item.description}</Text>
      </View>
    )
  }

  render () {
    if (this.props.lessons.loading || this.props.currentLesson.loading) {
      return <View />
    }
    return (
      <View style={{
        height: '100%',
        backgroundColor: 'white'
      }}>
        <Header />

        <PageTitle text='LECTURES LIST' />
        <FlatList
          data={this.props.lessons.Lessons}
          renderItem={this.renderLecture}
          style={{
            paddingHorizontal: 10
          }}
          numColumns={2}
        />
      </View>
    )
  }
}

const style = {
  title: {
    color: '#999',
    fontSize: 12,
    fontFamily: 'Exo2-Regular',
    textAlign: 'center'
  },
  overlay: {
    position: 'absolute',
    backgroundColor: '#fffc',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0
  }
}

const mapStateToProps = (state) => {
  return {
    selectedCourse: state.course.selectedCourse
  }
}

export default compose(
  connect(mapStateToProps),
  graphql(currentLessonQuery, {
    name: 'currentLesson',
    options: (ownProps) => {
      const courseId = ownProps.selectedCourse._id
      return ({
        variables: { courseId }
      })
    }
  }),
  graphql(lessonsQuery, {
    name: 'lessons',
    options: (ownProps) => {
      const courseId = ownProps.selectedCourse._id
      return {
        variables: { courseId }
      }
    }
  })
)(Lectures)
